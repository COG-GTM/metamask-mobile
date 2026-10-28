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
  case malformedArchive(offset: UInt64)
  case invalidEntryPath(name: String)
  public var errorDescription: String? {
    switch self {
    case let .notFound(file: file): return "Source file \(file) not found"
    case let .corruptFile(type: type): return "Invalid block type \(type) found"
    case let .malformedArchive(offset: offset): return "Malformed tar header at offset \(offset)"
    case let .invalidEntryPath(name: name): return "Tar entry \(name) escapes the destination"
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
  private func createFilesAndDirectories(path: String, tarObject: Any, size: UInt64,
                                         progress progressClosure: Closure?) throws -> Bool {
    try createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
    let root = URL(fileURLWithPath: path).standardizedFileURL
    var location: UInt64 = 0
    while location < size {
      guard size - location >= FileManager.tarBlockSize else {
        throw UntarError.malformedArchive(offset: location)
      }
      let dataStart = location + FileManager.tarBlockSize
      var blockCount: UInt64 = 1
      if let closure = progressClosure { closure(Double(location) / Double(size)) }

      let type = try self.type(object: tarObject, offset: location)
      switch type {
      case "0": // File
        let name = try self.name(object: tarObject, offset: location)
        let filePath = try entryPath(root: root, name: name)
        let entrySize = try self.size(object: tarObject, offset: location)
        guard entrySize <= size - dataStart else {
          throw UntarError.malformedArchive(offset: location)
        }
        if entrySize == 0 { try "".write(toFile: filePath, atomically: true, encoding: .utf8) } else {
          blockCount += (entrySize - 1) / FileManager.tarBlockSize + 1 // size / tarBlockSize rounded up
          try writeFileData(object: tarObject, location: dataStart, length: entrySize,
                            path: filePath)
        }
      case "5": // Directory
        let name = try self.name(object: tarObject, offset: location)
        let directoryPath = try entryPath(root: root, name: name)
        try createDirectory(atPath: directoryPath, withIntermediateDirectories: true,
                            attributes: nil)
      case "\0": break // Null block
      case "x": fallthrough // Extra header block
      case "1": fallthrough
      case "2": fallthrough
      case "3": fallthrough
      case "4": fallthrough
      case "6": fallthrough
      case "7": fallthrough
      case "g": // Not a file nor directory
        let entrySize = try self.size(object: tarObject, offset: location)
        guard entrySize <= size - dataStart else {
          throw UntarError.malformedArchive(offset: location)
        }
        blockCount += (entrySize + FileManager.tarBlockSize - 1) / FileManager.tarBlockSize
      default: throw UntarError.corruptFile(type: type) // Not a tar type
      }
      location += blockCount * FileManager.tarBlockSize
    }
    return true
  }

  private func entryPath(root: URL, name: String) throws -> String {
    let target = root.appendingPathComponent(name).standardizedFileURL.path
    let rootPath = root.path.hasSuffix("/") ? root.path : root.path + "/"
    guard !name.isEmpty, target == root.path || target.hasPrefix(rootPath) else {
      throw UntarError.invalidEntryPath(name: name)
    }
    return target
  }

  private func type(object: Any, offset: UInt64) throws -> UnicodeScalar {
    let typeData = try data(object: object, location: offset + FileManager.tarTypePosition,
                            length: 1)
    return UnicodeScalar(typeData[typeData.startIndex])
  }

  private func name(object: Any, offset: UInt64) throws -> String {
    let nameData = try data(object: object, location: offset + FileManager.tarNamePosition,
                            length: FileManager.tarNameSize)
    guard let name = String(data: nameData.prefix { $0 != 0 }, encoding: .utf8) else {
      throw UntarError.malformedArchive(offset: offset)
    }
    return name
  }

  // Size is an octal number padded with NULs or spaces.
  private func size(object: Any, offset: UInt64) throws -> UInt64 {
    let sizeData = try data(object: object, location: offset + FileManager.tarSizePosition,
                            length: FileManager.tarSizeSize)
    var value: UInt64 = 0
    var sawDigit = false
    var ended = false
    for byte in sizeData {
      switch byte {
      case UInt8(ascii: "0") ... UInt8(ascii: "7"):
        guard !ended else { throw UntarError.malformedArchive(offset: offset) }
        value = value * 8 + UInt64(byte - UInt8(ascii: "0"))
        sawDigit = true
      case 0, UInt8(ascii: " "):
        if sawDigit { ended = true }
      default:
        throw UntarError.malformedArchive(offset: offset)
      }
    }
    return value
  }

  private func writeFileData(object: Any, location _loc: UInt64, length _len: UInt64,
                             path: String) throws {
    let pathURL = URL(fileURLWithPath: path)
    let directoryPathURL = pathURL.deletingLastPathComponent()
    if let data = object as? Data {
      if !fileExists(atPath: directoryPathURL.path) {
        try createDirectory(atPath: directoryPathURL.path, withIntermediateDirectories: true)
      }
      createFile(atPath: path, contents: try self.data(object: data, location: _loc, length: _len),
                 attributes: nil)
    } else if let fileHandle = object as? FileHandle {
      if NSData().write(toFile: path, atomically: false) {
        guard let destinationFile = FileHandle(forWritingAtPath: path) else {
          throw UntarError.notFound(file: path)
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
  }

  private func data(object: Any, location: UInt64, length: UInt64) throws -> Data {
    if let data = object as? Data {
      let count = UInt64(data.count)
      guard location <= count, length <= count - location else {
        throw UntarError.malformedArchive(offset: location)
      }
      let start = data.startIndex + Int(location)
      return data.subdata(in: start ..< start + Int(length))
    } else if let fileHandle = object as? FileHandle {
      fileHandle.seek(toFileOffset: location)
      let chunk = autoreleasepool { // Needed to prevent heap overflow when reading large files
        fileHandle.readData(ofLength: Int(length))
      }
      guard UInt64(chunk.count) == length else {
        throw UntarError.malformedArchive(offset: location)
      }
      return chunk
    }
    throw UntarError.malformedArchive(offset: location)
  }

  // MARK: - Public Methods
  // Return true when no error for convenience
  @discardableResult func createFilesAndDirectories(path: String, tarData: Data,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: path, tarObject: tarData, size: UInt64(tarData.count),
                                  progress: progress)
  }

  @discardableResult func createFilesAndDirectories(url: URL, tarData: Data,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: url.path, tarData: tarData, progress: progress)
  }

  @discardableResult func createFilesAndDirectories(path: String, tarPath: String,
                                                    progress: Closure? = nil) throws -> Bool {
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: tarPath) {
      let attributes = try fileManager.attributesOfItem(atPath: tarPath)
      let size = attributes[.size] as! UInt64
      let fileHandle = FileHandle(forReadingAtPath: tarPath)!
      let result = try createFilesAndDirectories(path: path, tarObject: fileHandle, size: size,
                                                 progress: progress)
      fileHandle.closeFile()
      return result
    }

    throw UntarError.notFound(file: tarPath)
  }
}
