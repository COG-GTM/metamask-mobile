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
  case truncated
  case invalidName
  case unsafePath(name: String)
  case unsupportedEntry(type: UnicodeScalar, name: String)
  case tooManyEntries(limit: Int)
  case writeFailed(path: String)
  public var errorDescription: String? {
    switch self {
    case let .notFound(file: file): return "Source file \(file) not found"
    case let .corruptFile(type: type): return "Invalid block type \(type) found"
    case .truncated: return "Tar archive is truncated"
    case .invalidName: return "Tar entry has an invalid name"
    case let .unsafePath(name: name): return "Tar entry \(name) resolves outside of the target directory"
    case let .unsupportedEntry(type: type, name: name): return "Unsupported tar entry type \(type) for \(name)"
    case let .tooManyEntries(limit: limit): return "Tar archive contains more than \(limit) entries"
    case let .writeFailed(path: path): return "Failed to write \(path)"
    }
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
  private func createFilesAndDirectories(path: String, tarObject: Any, size totalSize: UInt64,
                                         maxEntries: Int,
                                         progress progressClosure: Closure?) throws -> Bool {
    try createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
    let root = URL(fileURLWithPath: path, isDirectory: true).standardizedFileURL
    var location: UInt64 = 0
    var entryCount = 0
    while location < totalSize {
      guard totalSize - location >= FileManager.tarBlockSize else { throw UntarError.truncated }
      var blockCount: UInt64 = 1
      if let closure = progressClosure { closure(Double(location) / Double(totalSize)) }

      let type = try self.type(object: tarObject, offset: location)
      switch type {
      case "0": // File
        entryCount += 1
        guard entryCount <= maxEntries else { throw UntarError.tooManyEntries(limit: maxEntries) }
        let name = try self.name(object: tarObject, offset: location)
        guard let filePath = try entryPath(root: root, name: name, allowRoot: false) else {
          throw UntarError.unsafePath(name: name)
        }
        let size = try self.size(object: tarObject, offset: location)
        let dataStart = location + FileManager.tarBlockSize
        guard size <= totalSize, dataStart <= totalSize - size else { throw UntarError.truncated }
        if size == 0 {
          try createParentDirectory(of: filePath)
          guard createFile(atPath: filePath, contents: Data(), attributes: nil) else {
            throw UntarError.writeFailed(path: filePath)
          }
        } else {
          blockCount += (size - 1) / FileManager.tarBlockSize + 1 // size / tarBlockSize rounded up
          try writeFileData(object: tarObject, location: dataStart, length: size, path: filePath)
        }
      case "5": // Directory
        entryCount += 1
        guard entryCount <= maxEntries else { throw UntarError.tooManyEntries(limit: maxEntries) }
        let name = try self.name(object: tarObject, offset: location)
        if let directoryPath = try entryPath(root: root, name: name, allowRoot: true) {
          try createDirectory(atPath: directoryPath, withIntermediateDirectories: true,
                              attributes: nil)
        }
      case "\0": break // Null block
      case "1", "2", "3", "4", "6": // Hard link, symlink, char/block device, FIFO
        let name = (try? self.name(object: tarObject, offset: location)) ?? ""
        throw UntarError.unsupportedEntry(type: type, name: name)
      case "x": fallthrough // Extended (pax) header
      case "7": fallthrough
      case "g": // Not a file nor directory
        let size = try self.size(object: tarObject, offset: location)
        blockCount += (size + FileManager.tarBlockSize - 1) / FileManager.tarBlockSize
      default: throw UntarError.corruptFile(type: type) // Not a tar type
      }
      location += blockCount * FileManager.tarBlockSize
    }
    return true
  }

  /// Resolves a tar entry name against `root`, rejecting anything that escapes it.
  /// Returns nil for directory entries that resolve to `root` itself (e.g. "./").
  private func entryPath(root: URL, name: String, allowRoot: Bool) throws -> String? {
    guard !name.isEmpty, !name.hasPrefix("/"), !name.contains("\0") else {
      throw UntarError.unsafePath(name: name)
    }
    let resolved = root.appendingPathComponent(name).standardizedFileURL.path
    if resolved == root.path {
      if allowRoot { return nil }
      throw UntarError.unsafePath(name: name)
    }
    guard resolved.hasPrefix(root.path.hasSuffix("/") ? root.path : root.path + "/") else {
      throw UntarError.unsafePath(name: name)
    }
    return resolved
  }

  private func createParentDirectory(of path: String) throws {
    let directoryPath = URL(fileURLWithPath: path).deletingLastPathComponent().path
    if !fileExists(atPath: directoryPath) {
      try createDirectory(atPath: directoryPath, withIntermediateDirectories: true)
    }
  }

  private func type(object: Any, offset: UInt64) throws -> UnicodeScalar {
    guard let typeData = data(object: object, location: offset + FileManager.tarTypePosition,
                              length: 1), typeData.count == 1 else {
      throw UntarError.truncated
    }
    return UnicodeScalar([UInt8](typeData)[0])
  }

  private func name(object: Any, offset: UInt64) throws -> String {
    guard let nameData = data(object: object, location: offset + FileManager.tarNamePosition,
                              length: FileManager.tarNameSize) else {
      throw UntarError.truncated
    }
    let bytes = [UInt8](nameData)
    let nameBytes = bytes.prefix { $0 != 0 }
    guard let name = String(bytes: nameBytes, encoding: .utf8) else {
      throw UntarError.invalidName
    }
    return name
  }

  private func size(object: Any, offset: UInt64) throws -> UInt64 {
    guard let sizeData = data(object: object, location: offset + FileManager.tarSizePosition,
                              length: FileManager.tarSizeSize),
          let sizeString = String(data: sizeData, encoding: .ascii) else {
      throw UntarError.truncated
    }
    return strtoull(sizeString, nil, 8) // Size is an octal number, convert to decimal
  }

  private func writeFileData(object: Any, location _loc: UInt64, length _len: UInt64,
                             path: String) throws {
    try createParentDirectory(of: path)
    if let data = object as? Data {
      guard createFile(atPath: path, contents: data.subdata(in: Int(_loc) ..< Int(_loc + _len)),
                       attributes: nil) else {
        throw UntarError.writeFailed(path: path)
      }
    } else if let fileHandle = object as? FileHandle {
      guard NSData().write(toFile: path, atomically: false),
            let destinationFile = FileHandle(forWritingAtPath: path) else {
        throw UntarError.writeFailed(path: path)
      }
      fileHandle.seek(toFileOffset: _loc)

      let maxSize = FileManager.tarMaxBlockLoadInMemory * FileManager.tarBlockSize
      var length = _len, location = _loc
      while length > maxSize {
        autoreleasepool { // Needed to prevent heap overflow when reading large files
          destinationFile.write(fileHandle.readData(ofLength: Int(maxSize)))
        }
        location += maxSize
        length -= maxSize
      }
      autoreleasepool { // Needed to prevent heap overflow when reading large files
        destinationFile.write(fileHandle.readData(ofLength: Int(length)))
      }
      destinationFile.closeFile()
    }
  }

  private func data(object: Any, location: UInt64, length: UInt64) -> Data? {
    if let data = object as? Data {
      guard location <= UInt64(data.count), length <= UInt64(data.count) - location else {
        return nil
      }
      return data.subdata(in: Int(location) ..< Int(location + length))
    } else if let fileHandle = object as? FileHandle {
      fileHandle.seek(toFileOffset: location)
      return autoreleasepool { // Needed to prevent heap overflow when reading large files
        fileHandle.readData(ofLength: Int(length))
      }
    }
    return nil
  }

  // MARK: - Public Methods
  // Return true when no error for convenience
  @discardableResult func createFilesAndDirectories(path: String, tarData: Data,
                                                    maxEntries: Int = Int.max,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: path, tarObject: tarData, size: UInt64(tarData.count),
                                  maxEntries: maxEntries, progress: progress)
  }

  @discardableResult func createFilesAndDirectories(url: URL, tarData: Data,
                                                    maxEntries: Int = Int.max,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: url.path, tarData: tarData, maxEntries: maxEntries,
                                  progress: progress)
  }

  @discardableResult func createFilesAndDirectories(path: String, tarPath: String,
                                                    maxEntries: Int = Int.max,
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
                                           maxEntries: maxEntries, progress: progress)
    }

    throw UntarError.notFound(file: tarPath)
  }
}
