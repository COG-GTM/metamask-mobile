//
//  Light-Swift-Untar.swift
//  MetaMask
//
//  Created by Owen Craston on 2023-11-29.
//  Copyright © 2023 MetaMask. All rights reserved.
//

// Modified verion of https://github.com/UInt2048/Light-Swift-Untar

import Foundation

public typealias Closure = (Double) -> Void

enum UntarError: Error, LocalizedError {
  case notFound(file: String)
  case corruptFile(type: UnicodeScalar)
  case malformedHeader(offset: UInt64)
  case unsafeEntryPath(name: String)
  case tooManyEntries(limit: Int)
  case sizeLimitExceeded(limit: UInt64)
  public var errorDescription: String? {
    switch self {
    case let .notFound(file: file): return "Source file \(file) not found"
    case let .corruptFile(type: type): return "Invalid block type \(type) found"
    case let .malformedHeader(offset: offset): return "Malformed tar header at offset \(offset)"
    case let .unsafeEntryPath(name: name): return "Tar entry is outside of the target directory: \(name)"
    case let .tooManyEntries(limit: limit): return "Tarball exceeds the limit of \(limit) entries"
    case let .sizeLimitExceeded(limit: limit): return "Tarball exceeds the extracted size limit of \(limit) bytes"
    }
  }
}

public struct UntarLimits {
  public let maxEntries: Int
  public let maxExtractedSize: UInt64

  public init(maxEntries: Int, maxExtractedSize: UInt64) {
    self.maxEntries = maxEntries
    self.maxExtractedSize = maxExtractedSize
  }
}

public extension FileManager {
  // MARK: - Definitions
  private static var tarBlockSize: UInt64 = 512
  private static var tarTypePosition: UInt64 = 156
  private static var tarNamePosition: UInt64 = 0
  private static var tarNameSize: UInt64 = 100
  private static var tarSizePosition: UInt64 = 124
  private static var tarSizeSize: UInt64 = 12
  private static var tarMaxBlockLoadInMemory: UInt64 = 100

  // MARK: - Private Methods
  private func createFilesAndDirectories(path: String, tarObject: Any, size: UInt64,
                                         limits: UntarLimits?,
                                         progress progressClosure: Closure?) throws -> Bool {
    try createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
    let baseURL = URL(fileURLWithPath: path, isDirectory: true).standardizedFileURL
    var location: UInt64 = 0
    var entryCount = 0
    var extractedSize: UInt64 = 0
    while location < size {
      guard size - location >= FileManager.tarBlockSize else {
        throw UntarError.malformedHeader(offset: location)
      }
      var blockCount: UInt64 = 1
      if let closure = progressClosure { closure(Double(location) / Double(size)) }

      let type = try self.type(object: tarObject, offset: location, size: size)
      if type != "\0" {
        entryCount += 1
        if let limits = limits, entryCount > limits.maxEntries {
          throw UntarError.tooManyEntries(limit: limits.maxEntries)
        }
      }
      switch type {
      case "0": // File
        let name = try self.name(object: tarObject, offset: location, size: size)
        let filePath = try safePath(baseURL: baseURL, name: name)
        let entrySize = try self.size(object: tarObject, offset: location, size: size)
        let dataLocation = location + FileManager.tarBlockSize
        guard entrySize <= size - dataLocation else {
          throw UntarError.malformedHeader(offset: location)
        }
        if let limits = limits {
          guard entrySize <= limits.maxExtractedSize - extractedSize else {
            throw UntarError.sizeLimitExceeded(limit: limits.maxExtractedSize)
          }
        }
        extractedSize += entrySize
        if entrySize == 0 { try "".write(toFile: filePath, atomically: true, encoding: .utf8) } else {
          blockCount += (entrySize - 1) / FileManager.tarBlockSize + 1 // size / tarBlockSize rounded up
          try writeFileData(object: tarObject, location: dataLocation,
                            length: entrySize, path: filePath)
        }
      case "5": // Directory
        let name = try self.name(object: tarObject, offset: location, size: size)
        let directoryPath = try safePath(baseURL: baseURL, name: name)
        try createDirectory(atPath: directoryPath, withIntermediateDirectories: true,
                            attributes: nil)
      case "\0": break // Null block
      case "1": fallthrough
      case "2": fallthrough
      case "3": fallthrough
      case "4": fallthrough
      case "6": fallthrough
      case "7": fallthrough
      case "x": fallthrough // Extended header
      case "g": // Not a file nor directory
        let entrySize = try self.size(object: tarObject, offset: location, size: size)
        guard entrySize <= size - location - FileManager.tarBlockSize else {
          throw UntarError.malformedHeader(offset: location)
        }
        blockCount += (entrySize + FileManager.tarBlockSize - 1) / FileManager.tarBlockSize
      default: throw UntarError.corruptFile(type: type) // Not a tar type
      }
      location += blockCount * FileManager.tarBlockSize
    }
    return true
  }

  private func safePath(baseURL: URL, name: String) throws -> String {
    let components = name.split(separator: "/", omittingEmptySubsequences: true)
    guard !name.hasPrefix("/"), !components.contains("..") else {
      throw UntarError.unsafeEntryPath(name: name)
    }
    let entryURL = baseURL.appendingPathComponent(name).standardizedFileURL
    let basePath = baseURL.path.hasSuffix("/") ? baseURL.path : baseURL.path + "/"
    guard entryURL.path == baseURL.path || entryURL.path.hasPrefix(basePath) else {
      throw UntarError.unsafeEntryPath(name: name)
    }
    return entryURL.path
  }

  private func type(object: Any, offset: UInt64, size: UInt64) throws -> UnicodeScalar {
    let typeData = try data(object: object, location: offset + FileManager.tarTypePosition,
                            length: 1, size: size)
    return UnicodeScalar([UInt8](typeData)[0])
  }

  private func name(object: Any, offset: UInt64, size: UInt64) throws -> String {
    let nameData = try data(object: object, location: offset + FileManager.tarNamePosition,
                            length: FileManager.tarNameSize, size: size)
    let nameBytes = [UInt8](nameData).prefix { $0 != 0 }
    guard !nameBytes.isEmpty, let name = String(bytes: nameBytes, encoding: .utf8) else {
      throw UntarError.malformedHeader(offset: offset)
    }
    return name
  }

  private func size(object: Any, offset: UInt64, size: UInt64) throws -> UInt64 {
    let sizeData = try data(object: object, location: offset + FileManager.tarSizePosition,
                            length: FileManager.tarSizeSize, size: size)
    let sizeBytes = [UInt8](sizeData)
    // Size is a NUL or space terminated octal number
    let digits = sizeBytes.drop { $0 == 0x20 }.prefix { $0 != 0 && $0 != 0x20 }
    guard !digits.isEmpty, digits.allSatisfy({ $0 >= 0x30 && $0 <= 0x37 }),
          let value = UInt64(String(decoding: digits, as: UTF8.self), radix: 8) else {
      throw UntarError.malformedHeader(offset: offset)
    }
    return value
  }

  private func writeFileData(object: Any, location _loc: UInt64, length _len: UInt64,
                             path: String) throws {
    let pathURL = URL(fileURLWithPath: path)
    let directoryPathURL = pathURL.deletingLastPathComponent()
    if !fileExists(atPath: directoryPathURL.path) {
      try createDirectory(atPath: directoryPathURL.path, withIntermediateDirectories: true)
    }
    if let data = object as? Data {
      let start = data.startIndex + Int(_loc)
      guard createFile(atPath: path, contents: data.subdata(in: start ..< start + Int(_len)),
                       attributes: nil) else {
        throw UntarError.notFound(file: path)
      }
    } else if let fileHandle = object as? FileHandle {
      guard NSData().write(toFile: path, atomically: false),
            let destinationFile = FileHandle(forWritingAtPath: path) else {
        throw UntarError.notFound(file: path)
      }
      defer { destinationFile.closeFile() }
      fileHandle.seek(toFileOffset: _loc)

      let maxSize = FileManager.tarMaxBlockLoadInMemory * FileManager.tarBlockSize
      var length = _len
      while length > 0 {
        let chunk = min(length, maxSize)
        let chunkData = autoreleasepool { // Needed to prevent heap overflow when reading large files
          fileHandle.readData(ofLength: Int(chunk))
        }
        guard UInt64(chunkData.count) == chunk else {
          throw UntarError.malformedHeader(offset: _loc)
        }
        destinationFile.write(chunkData)
        length -= chunk
      }
    }
  }

  private func data(object: Any, location: UInt64, length: UInt64, size: UInt64) throws -> Data {
    guard location <= size, length <= size - location else {
      throw UntarError.malformedHeader(offset: location)
    }
    if let data = object as? Data {
      let start = data.startIndex + Int(location)
      return data.subdata(in: start ..< start + Int(length))
    } else if let fileHandle = object as? FileHandle {
      fileHandle.seek(toFileOffset: location)
      let result = autoreleasepool { // Needed to prevent heap overflow when reading large files
        fileHandle.readData(ofLength: Int(length))
      }
      guard UInt64(result.count) == length else {
        throw UntarError.malformedHeader(offset: location)
      }
      return result
    }
    throw UntarError.malformedHeader(offset: location)
  }

  // MARK: - Public Methods
  // Return true when no error for convenience
  @discardableResult func createFilesAndDirectories(path: String, tarData: Data,
                                                    limits: UntarLimits? = nil,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: path, tarObject: tarData, size: UInt64(tarData.count),
                                  limits: limits, progress: progress)
  }

  @discardableResult func createFilesAndDirectories(url: URL, tarData: Data,
                                                    limits: UntarLimits? = nil,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: url.path, tarData: tarData, limits: limits,
                                  progress: progress)
  }

  @discardableResult func createFilesAndDirectories(path: String, tarPath: String,
                                                    limits: UntarLimits? = nil,
                                                    progress: Closure? = nil) throws -> Bool {
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: tarPath) {
      let attributes = try fileManager.attributesOfItem(atPath: tarPath)
      guard let size = (attributes[.size] as? NSNumber)?.uint64Value,
            let fileHandle = FileHandle(forReadingAtPath: tarPath) else {
        throw UntarError.notFound(file: tarPath)
      }
      defer { fileHandle.closeFile() }
      return try createFilesAndDirectories(path: path, tarObject: fileHandle, size: size,
                                           limits: limits, progress: progress)
    }

    throw UntarError.notFound(file: tarPath)
  }
}
