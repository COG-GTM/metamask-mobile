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
  case archiveTooLarge(file: String)
  case extractedSizeExceeded(limit: Int)
  case destinationNotEmpty(directory: String)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .archiveTooLarge(file: file):
      return "Archive \(file) exceeds the maximum allowed size"
    case let .extractedSizeExceeded(limit: limit):
      return "Archive exceeds the maximum extracted size of \(limit) bytes"
    case let .destinationNotEmpty(directory: directory):
      return "Destination directory \(directory) must be empty"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {
  static let maxArchiveBytes: UInt64 = 250 * 1024 * 1024
  static let maxExtractedBytes = 64 * 1024 * 1024
  static let maxEntries = 5000
  /// Bound on the inflated tar stream: file contents plus headers, padding and pax records.
  static let maxTarStreamBytes = maxExtractedBytes + 16 * 1024 * 1024

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func extractTgzFile(atPath path: String, toDirectory directory: String) throws -> String {
    let fileManager = FileManager.default
    guard fileManager.fileExists(atPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    let attributes = try fileManager.attributesOfItem(atPath: path)
    guard let archiveSize = (attributes[.size] as? NSNumber)?.uint64Value,
          archiveSize <= RNTar.maxArchiveBytes else {
      throw UnTarError.archiveTooLarge(file: path)
    }
    let sourceUrl = URL(fileURLWithPath: path)
    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)

    if fileManager.fileExists(atPath: destinationUrl.path) {
      let contents = try fileManager.contentsOfDirectory(atPath: destinationUrl.path)
      guard contents.isEmpty else {
        throw UnTarError.destinationNotEmpty(directory: destinationUrl.path)
      }
    }

    let data: Data
    do {
      data = try Data(contentsOf: sourceUrl)
    } catch {
      throw UnTarError.unableToDecompressFile(file: path, error: error)
    }
    let tarData = try RNTar.isGzipped(data)
      ? RNTar.gunzip(data, maxOutputBytes: RNTar.maxTarStreamBytes)
      : data
    guard tarData.count <= RNTar.maxTarStreamBytes else {
      throw UnTarError.extractedSizeExceeded(limit: RNTar.maxTarStreamBytes)
    }

    try fileManager.createFilesAndDirectories(path: destinationUrl.path, tarData: tarData,
                                              maxEntries: RNTar.maxEntries,
                                              maxFileBytes: UInt64(RNTar.maxExtractedBytes))
    return "\(destinationUrl.path)/package"
  }

  static func isGzipped(_ data: Data) -> Bool {
    return data.count >= 2 && data[data.startIndex] == 0x1f && data[data.startIndex + 1] == 0x8b
  }

  /// Inflates gzip data, aborting as soon as the output would exceed `maxOutputBytes`.
  static func gunzip(_ data: Data, maxOutputBytes: Int) throws -> Data {
    var stream = z_stream()
    var status = inflateInit2_(&stream, MAX_WBITS + 32, ZLIB_VERSION,
                               Int32(MemoryLayout<z_stream>.size))
    guard status == Z_OK else {
      throw UnTarError.unableToDecompressFile(file: "gzip stream")
    }
    defer { inflateEnd(&stream) }

    let chunkSize = 64 * 1024
    var chunk = [UInt8](repeating: 0, count: chunkSize)
    var output = Data()

    try data.withUnsafeBytes { (input: UnsafeRawBufferPointer) in
      stream.next_in = UnsafeMutablePointer<Bytef>(
        mutating: input.bindMemory(to: Bytef.self).baseAddress)
      stream.avail_in = uInt(input.count)
      repeat {
        try chunk.withUnsafeMutableBufferPointer { out in
          stream.next_out = out.baseAddress
          stream.avail_out = uInt(chunkSize)
          status = inflate(&stream, Z_NO_FLUSH)
          guard status == Z_OK || status == Z_STREAM_END else {
            throw UnTarError.unableToDecompressFile(file: "gzip stream")
          }
          let produced = chunkSize - Int(stream.avail_out)
          guard output.count + produced <= maxOutputBytes else {
            throw UnTarError.extractedSizeExceeded(limit: maxOutputBytes)
          }
          output.append(out.baseAddress!, count: produced)
        }
      } while status != Z_STREAM_END
    }
    return output
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
