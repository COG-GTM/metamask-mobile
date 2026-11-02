//
//  RnTar.swift
//  MetaMask
//
//  Created by Owen Craston on 2023-11-29.
//  Copyright © 2023 MetaMask. All rights reserved.
//

import Foundation
import Gzip
import zlib

enum UnTarError: Error, LocalizedError {
  case unableToDecompressFile(file: String, error: Error? = nil)
  case sourceFileNotFound(file: String)
  case destinationNotEmpty(directory: String)
  case sizeLimitExceeded(file: String)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .destinationNotEmpty(directory: directory):
      return "Destination \(directory) must be a new or empty directory"
    case let .sizeLimitExceeded(file: file):
      return "\(file) exceeds the Snap tarball size limit"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // Inflates incrementally so a gzip bomb is rejected before its full output is allocated.
  static func gunzip(_ data: Data, path: String, limit: UInt64) throws -> Data {
    var stream = z_stream()
    var status = inflateInit2_(&stream, MAX_WBITS + 32, ZLIB_VERSION,
                               Int32(MemoryLayout<z_stream>.size))
    guard status == Z_OK else { throw UnTarError.unableToDecompressFile(file: path) }
    defer { inflateEnd(&stream) }

    let chunkSize = 64 * 1024
    var chunk = [UInt8](repeating: 0, count: chunkSize)
    var output = Data()
    try data.withUnsafeBytes { (input: UnsafeRawBufferPointer) in
      stream.next_in = UnsafeMutablePointer(
        mutating: input.bindMemory(to: Bytef.self).baseAddress)
      stream.avail_in = uInt(input.count)
      repeat {
        try chunk.withUnsafeMutableBufferPointer { buffer in
          stream.next_out = buffer.baseAddress
          stream.avail_out = uInt(chunkSize)
          status = inflate(&stream, Z_NO_FLUSH)
          guard status == Z_OK || status == Z_STREAM_END else {
            throw UnTarError.unableToDecompressFile(file: path)
          }
          let produced = chunkSize - Int(stream.avail_out)
          guard UInt64(output.count + produced) <= limit else {
            throw UnTarError.sizeLimitExceeded(file: path)
          }
          output.append(buffer.baseAddress!, count: produced)
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
    let sourceUrl = URL(fileURLWithPath: path)
    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)
    let sizeLimit = FileManager.tarMaxExtractedSize
    if let attributes = try? fileManager.attributesOfItem(atPath: path),
       let fileSize = (attributes[.size] as? NSNumber)?.uint64Value, fileSize > sizeLimit {
      throw UnTarError.sizeLimitExceeded(file: path)
    }
    // Read the compressed data from the file
    guard let data = try? Data(contentsOf: sourceUrl) else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    // Tar headers and padding come on top of the file contents the extractor caps.
    let decompressedLimit = sizeLimit * 2
    let decompressedData = data.isGzipped
      ? try RNTar.gunzip(data, path: path, limit: decompressedLimit) : data
    guard UInt64(decompressedData.count) <= decompressedLimit else {
      throw UnTarError.sizeLimitExceeded(file: path)
    }

    // Only extract into a dedicated directory so entries cannot overwrite existing app files.
    if fileManager.fileExists(atPath: destinationUrl.path),
       !((try? fileManager.contentsOfDirectory(atPath: destinationUrl.path))?.isEmpty ?? false) {
      throw UnTarError.destinationNotEmpty(directory: destinationUrl.path)
    }
    let untarResponse = try FileManager.default
      .createFilesAndDirectories(path: destinationUrl.path, tarData: decompressedData)

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
