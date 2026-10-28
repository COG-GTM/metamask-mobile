//
//  RnTar.swift
//  MetaMask
//
//  Created by Owen Craston on 2023-11-29.
//  Copyright © 2023 MetaMask. All rights reserved.
//

import Foundation
import zlib

enum UnTarError: Error, LocalizedError {
  case unableToDecompressFile(file: String, error: Error? = nil)
  case sourceFileNotFound(file: String)
  case limitExceeded(limit: UInt64)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .limitExceeded(limit: limit):
      return "Tarball exceeds the limit of \(limit) bytes"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {
  // Matches TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers (250 MB).
  static let maxTarballBytes: UInt64 = 262_144_000
  static let maxEntries = 5000
  private static let chunkSize = 64 * 1024

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private func isGzipped(atPath path: String) -> Bool {
    guard let handle = FileHandle(forReadingAtPath: path) else { return false }
    defer { handle.closeFile() }
    let magic = [UInt8](handle.readData(ofLength: 2))
    return magic == [0x1f, 0x8b]
  }

  // Streams the gzip file at `path` into `outputPath`, aborting once more than
  // `maxBytes` of decompressed data has been produced.
  func gunzipFile(atPath path: String, toPath outputPath: String, maxBytes: UInt64) throws {
    guard let input = FileHandle(forReadingAtPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    defer { input.closeFile() }
    guard FileManager.default.createFile(atPath: outputPath, contents: nil),
          let output = FileHandle(forWritingAtPath: outputPath) else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    defer { output.closeFile() }

    var stream = z_stream()
    // MAX_WBITS + 32 enables automatic gzip/zlib header detection.
    guard inflateInit2_(&stream, MAX_WBITS + 32, ZLIB_VERSION,
                        Int32(MemoryLayout<z_stream>.size)) == Z_OK else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    defer { inflateEnd(&stream) }

    let chunkSize = RNTar.chunkSize
    var outBuffer = [UInt8](repeating: 0, count: chunkSize)
    var totalBytes: UInt64 = 0
    var status = Z_OK

    while status != Z_STREAM_END {
      let inData = input.readData(ofLength: chunkSize)
      if inData.isEmpty {
        throw UnTarError.unableToDecompressFile(file: path)
      }
      try inData.withUnsafeBytes { (inPointer: UnsafeRawBufferPointer) in
        stream.next_in = UnsafeMutablePointer(
          mutating: inPointer.bindMemory(to: Bytef.self).baseAddress)
        stream.avail_in = uInt(inData.count)
        repeat {
          let produced: Int = try outBuffer.withUnsafeMutableBufferPointer { outPointer in
            stream.next_out = outPointer.baseAddress
            stream.avail_out = uInt(chunkSize)
            status = inflate(&stream, Z_NO_FLUSH)
            guard status == Z_OK || status == Z_STREAM_END || status == Z_BUF_ERROR else {
              throw UnTarError.unableToDecompressFile(file: path)
            }
            return chunkSize - Int(stream.avail_out)
          }
          totalBytes += UInt64(produced)
          if totalBytes > maxBytes {
            throw UnTarError.limitExceeded(limit: maxBytes)
          }
          if produced > 0 {
            output.write(Data(outBuffer[0..<produced]))
          }
        } while stream.avail_out == 0 && status != Z_STREAM_END
      }
    }
  }

  func extractTgzFile(atPath path: String, toDirectory directory: String) throws -> String {
    let fileManager = FileManager.default
    guard fileManager.fileExists(atPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)
    let limits = UntarLimits(maxEntries: RNTar.maxEntries, maxTotalBytes: RNTar.maxTarballBytes)

    var tarPath = path
    var temporaryTarPath: String?
    defer {
      if let temporaryTarPath = temporaryTarPath {
        try? fileManager.removeItem(atPath: temporaryTarPath)
      }
    }

    if isGzipped(atPath: path) {
      let temporaryPath = (NSTemporaryDirectory() as NSString)
        .appendingPathComponent("rntar-\(UUID().uuidString).tar")
      temporaryTarPath = temporaryPath
      try gunzipFile(atPath: path, toPath: temporaryPath, maxBytes: RNTar.maxTarballBytes)
      tarPath = temporaryPath
    } else {
      let size = (try fileManager.attributesOfItem(atPath: path)[.size] as? NSNumber)?.uint64Value ?? 0
      if size > RNTar.maxTarballBytes {
        throw UnTarError.limitExceeded(limit: RNTar.maxTarballBytes)
      }
    }

    // Extract into a fresh staging directory so a failed extraction never touches
    // existing files, then move the validated package into place.
    try fileManager.createDirectory(at: destinationUrl, withIntermediateDirectories: true)
    let stagingUrl = destinationUrl.appendingPathComponent(".rntar-\(UUID().uuidString)",
                                                           isDirectory: true)
    defer { try? fileManager.removeItem(at: stagingUrl) }
    // Extract into stagingUrl/extract so archive entries can never collide with
    // stagingUrl/previous-package, where the existing package is backed up.
    let extractUrl = stagingUrl.appendingPathComponent("extract", isDirectory: true)
    try fileManager.createFilesAndDirectories(path: extractUrl.path, tarPath: tarPath,
                                              limits: limits)

    let stagedPackageUrl = extractUrl.appendingPathComponent("package", isDirectory: true)
    var isDirectory: ObjCBool = false
    guard fileManager.fileExists(atPath: stagedPackageUrl.path, isDirectory: &isDirectory),
          isDirectory.boolValue else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    // Move any existing package aside (into the staging directory, which is
    // removed afterwards) so it can be restored if the swap fails.
    let packageUrl = destinationUrl.appendingPathComponent("package", isDirectory: true)
    let previousPackageUrl = stagingUrl.appendingPathComponent("previous-package")
    let hadPackage = (try? packageUrl.checkResourceIsReachable()) == true
      || (try? fileManager.destinationOfSymbolicLink(atPath: packageUrl.path)) != nil
    if hadPackage {
      try fileManager.moveItem(at: packageUrl, to: previousPackageUrl)
    }
    do {
      try fileManager.moveItem(at: stagedPackageUrl, to: packageUrl)
    } catch {
      if hadPackage {
        try? fileManager.moveItem(at: previousPackageUrl, to: packageUrl)
      }
      throw error
    }
    return packageUrl.path
  }

  @objc func unTar(_ pathToRead: String, pathToWrite: String,
                   resolver: @escaping RCTPromiseResolveBlock,
                   rejecter: @escaping RCTPromiseRejectBlock) {
    do {
        let uncompressedPath = try extractTgzFile(atPath: pathToRead, toDirectory: pathToWrite)
        resolver(uncompressedPath)
    } catch {
        rejecter("Error uncompressing file:", error.localizedDescription, error)
    }
  }
}
