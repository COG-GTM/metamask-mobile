//
//  RnTar.swift
//  MetaMask
//
//  Created by Owen Craston on 2023-11-29.
//  Copyright © 2023 MetaMask. All rights reserved.
//

import Foundation
import Gzip

enum UnTarError: Error, LocalizedError {
  case unableToDecompressFile(file: String, error: Error? = nil)
  case sourceFileNotFound(file: String)
  case destinationNotEmpty(directory: String)
  public var errorDescription: String? {
    switch self {
    case let .unableToDecompressFile(file: file, error: error):
      return "RNTar failed to decompress file \(file)  \(error as Optional)"
    case let .sourceFileNotFound(file: file):
      return "Source file \(file) not found"
    case let .destinationNotEmpty(directory: directory):
      return "Destination \(directory) must be a new or empty directory"
    }
  }
}

@objc(RNTar)
class RNTar: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func extractTgzFile(atPath path: String, toDirectory directory: String) throws -> String {
    let fileManager = FileManager.default
    guard fileManager.fileExists(atPath: path) else {
      throw UnTarError.sourceFileNotFound(file: path)
    }
    let sourceUrl = URL(fileURLWithPath: path)
    let destinationUrl = URL(fileURLWithPath: directory, isDirectory: true)
    // Read the compressed data from the file
    guard
        let data = try? Data(contentsOf: sourceUrl),
        let decompressedData = data.isGzipped ? try? data.gunzipped() : data
    else {
      throw UnTarError.unableToDecompressFile(file: path)
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
