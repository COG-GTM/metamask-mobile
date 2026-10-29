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
  case sizeLimitExceeded(file: String, limit: UInt64)
  case outputDirectoryNotEmpty(directory: String)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .sizeLimitExceeded(file: file, limit: limit):
      return "RNTar file \(file) exceeds the size limit of \(limit) bytes"
    case let .outputDirectoryNotEmpty(directory: directory):
      return "RNTar output directory \(directory) must be a new, empty directory"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {
  // Mirrors TARBALL_SIZE_SAFETY_LIMIT from @metamask/snaps-controllers.
  static let tarballSizeSafetyLimit: UInt64 = 262_144_000
  // Mirrors MAX_TARBALL_ENTRIES in app/core/Snaps/location/npm.ts.
  static let maxTarballEntries = 5000

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  static func isGzipped(_ data: Data) -> Bool {
    return data.count >= 2 && data[data.startIndex] == 0x1f && data[data.startIndex + 1] == 0x8b
  }

  /// Inflates gzip data, aborting as soon as the output exceeds `maxOutputSize`.
  static func gunzip(_ data: Data, maxOutputSize: UInt64, file: String) throws -> Data {
    guard !data.isEmpty else {
      throw UnTarError.unableToDecompressFile(file: file)
    }
    var stream = z_stream()
    var status = inflateInit2_(&stream, MAX_WBITS + 32, ZLIB_VERSION,
                               Int32(MemoryLayout<z_stream>.size))
    guard status == Z_OK else {
      throw UnTarError.unableToDecompressFile(file: file)
    }
    defer { inflateEnd(&stream) }

    let chunkSize = 64 * 1024
    var output = Data()
    var buffer = [UInt8](repeating: 0, count: chunkSize)
    try data.withUnsafeBytes { (input: UnsafeRawBufferPointer) in
      stream.next_in = UnsafeMutablePointer<Bytef>(
        mutating: input.bindMemory(to: Bytef.self).baseAddress)
      stream.avail_in = uInt(input.count)
      repeat {
        let produced: Int = buffer.withUnsafeMutableBufferPointer { out in
          stream.next_out = out.baseAddress
          stream.avail_out = uInt(chunkSize)
          status = inflate(&stream, Z_NO_FLUSH)
          return chunkSize - Int(stream.avail_out)
        }
        guard status == Z_OK || status == Z_STREAM_END else {
          throw UnTarError.unableToDecompressFile(file: file)
        }
        guard UInt64(output.count + produced) <= maxOutputSize else {
          throw UnTarError.sizeLimitExceeded(file: file, limit: maxOutputSize)
        }
        output.append(buffer, count: produced)
        if status == Z_OK && produced == 0 && stream.avail_in == 0 {
          throw UnTarError.unableToDecompressFile(file: file)
        }
      } while status != Z_STREAM_END
    }
    return output
  }

  func extractTgzFile(atPath path: String, toDirectory directory: String) throws -> String {
    let fileManager = FileManager.default
    guard fileManager.fileExists(atPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    let attributes = try fileManager.attributesOfItem(atPath: path)
    guard let compressedSize = (attributes[.size] as? NSNumber)?.uint64Value else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    guard compressedSize <= RNTar.tarballSizeSafetyLimit else {
      throw UnTarError.sizeLimitExceeded(file: path, limit: RNTar.tarballSizeSafetyLimit)
    }

    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)
    var isDirectory: ObjCBool = false
    if fileManager.fileExists(atPath: destinationUrl.path, isDirectory: &isDirectory) {
      guard isDirectory.boolValue,
            try fileManager.contentsOfDirectory(atPath: destinationUrl.path).isEmpty else {
        throw UnTarError.outputDirectoryNotEmpty(directory: destinationUrl.path)
      }
    }

    let data: Data
    do {
      data = try Data(contentsOf: URL(fileURLWithPath: path))
    } catch {
      throw UnTarError.unableToDecompressFile(file: path, error: error)
    }
    let tarData = RNTar.isGzipped(data)
      ? try RNTar.gunzip(data, maxOutputSize: RNTar.tarballSizeSafetyLimit, file: path)
      : data

    let limits = UntarLimits(maxEntries: RNTar.maxTarballEntries,
                             maxExtractedSize: RNTar.tarballSizeSafetyLimit)
    let untarResponse = try fileManager
      .createFilesAndDirectories(path: destinationUrl.path, tarData: tarData, limits: limits)

    if untarResponse {
      return "\(destinationUrl.path)/package"
    }
    throw UnTarError.unableToDecompressFile(file: destinationUrl.path)
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
