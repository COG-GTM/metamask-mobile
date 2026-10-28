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
  case sizeLimitExceeded(file: String, limit: Int)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .sizeLimitExceeded(file: file, limit: limit):
      return "RNTar refused to extract \(file): archive exceeds \(limit) bytes"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {
  // Mirrors TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers.
  static let maxArchiveSize = 262_144_000
  static let maxInflatedSize = 262_144_000
  private static let inflateChunkSize = 64 * 1024

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func extractTgzFile(atPath path: String, toDirectory directory: String,
                      maxArchiveSize: Int = RNTar.maxArchiveSize,
                      maxInflatedSize: Int = RNTar.maxInflatedSize) throws -> String {
    let fileManager = FileManager.default
    guard fileManager.fileExists(atPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    let sourceUrl = URL(fileURLWithPath: path)
    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)

    guard let fileSize = try? sourceUrl.resourceValues(forKeys: [.fileSizeKey]).fileSize else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    guard fileSize <= maxArchiveSize else {
      throw UnTarError.sizeLimitExceeded(file: path, limit: maxArchiveSize)
    }
    guard let data = try? Data(contentsOf: sourceUrl) else {
      throw UnTarError.unableToDecompressFile(file: path)
    }
    guard data.count <= maxArchiveSize else {
      throw UnTarError.sizeLimitExceeded(file: path, limit: maxArchiveSize)
    }
    let decompressedData = RNTar.isGzipped(data)
      ? try RNTar.gunzip(data, limit: maxInflatedSize, file: path)
      : data

    if !fileManager.fileExists(atPath: sourceUrl.path) {
      do {
        try (fileManager.createDirectory(atPath: sourceUrl.path, withIntermediateDirectories: true))
      } catch {
        throw UnTarError.unableToDecompressFile(file: path)
      }
    }
    let untarResponse = try FileManager.default
      .createFilesAndDirectories(path: destinationUrl.path, tarData: decompressedData)

    if untarResponse {
      return "\(destinationUrl.path)/package"
    }
    throw UnTarError.unableToDecompressFile(file: destinationUrl.path)
  }

  static func isGzipped(_ data: Data) -> Bool {
    return data.count >= 2 && data[data.startIndex] == 0x1f && data[data.startIndex + 1] == 0x8b
  }

  // Streams the inflate so a gzip bomb is rejected once it passes `limit`
  // instead of being fully materialised in memory.
  static func gunzip(_ data: Data, limit: Int, file: String) throws -> Data {
    var stream = z_stream()
    var status = inflateInit2_(&stream, MAX_WBITS + 32, ZLIB_VERSION,
                               Int32(MemoryLayout<z_stream>.size))
    guard status == Z_OK else {
      throw UnTarError.unableToDecompressFile(file: file)
    }
    defer { inflateEnd(&stream) }

    var output = Data()
    var chunk = [UInt8](repeating: 0, count: inflateChunkSize)
    try data.withUnsafeBytes { (input: UnsafeRawBufferPointer) in
      stream.next_in = UnsafeMutablePointer<Bytef>(
        mutating: input.bindMemory(to: Bytef.self).baseAddress)
      stream.avail_in = uInt(input.count)
      repeat {
        let produced = chunk.withUnsafeMutableBufferPointer { buffer -> Int in
          stream.next_out = buffer.baseAddress
          stream.avail_out = uInt(buffer.count)
          status = inflate(&stream, Z_NO_FLUSH)
          return buffer.count - Int(stream.avail_out)
        }
        guard status == Z_OK || status == Z_STREAM_END else {
          throw UnTarError.unableToDecompressFile(file: file)
        }
        guard produced <= limit - output.count else {
          throw UnTarError.sizeLimitExceeded(file: file, limit: limit)
        }
        output.append(contentsOf: chunk[0 ..< produced])
        if status == Z_OK && produced == 0 && stream.avail_in == 0 {
          throw UnTarError.unableToDecompressFile(file: file)
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
