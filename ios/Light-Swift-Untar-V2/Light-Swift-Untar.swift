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
  case unsafeEntry(name: String)
  case unsupportedEntry(type: UnicodeScalar)
  case truncatedArchive
  case malformedArchive(offset: UInt64)
  case sizeLimitExceeded(limit: UInt64)
  public var errorDescription: String? {
    switch self {
    case let .notFound(file: file): return "Source file \(file) not found"
    case let .corruptFile(type: type): return "Invalid block type \(type) found"
    case let .unsafeEntry(name: name): return "Entry \(name) resolves outside the destination"
    case let .unsupportedEntry(type: type): return "Unsupported tar entry type \(type)"
    case .truncatedArchive: return "Archive entry extends past the end of the archive"
    case let .malformedArchive(offset: offset): return "Malformed tar header at offset \(offset)"
    case let .sizeLimitExceeded(limit: limit): return "Archive exceeds limit of \(limit) bytes"
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
  // Mirrors TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers.
  static var tarMaxExtractedSize: UInt64 = 262_144_000
  // npm tarballs keep every file under this top-level directory.
  private static var tarPackageDirectory = "package"

  // MARK: - Private Methods
  private func createFilesAndDirectories(path: String, tarObject: Any, size totalSize: UInt64,
                                         progress progressClosure: Closure?) throws -> Bool {
    try createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
    let rootURL = URL(fileURLWithPath: path, isDirectory: true).standardizedFileURL
    let packageURL = rootURL.appendingPathComponent(FileManager.tarPackageDirectory,
                                                    isDirectory: true)
    var extractedSize: UInt64 = 0
    var location: UInt64 = 0
    while location + FileManager.tarBlockSize <= totalSize {
      let dataStart = location + FileManager.tarBlockSize
      var blockCount: UInt64 = 1
      if let closure = progressClosure { closure(Double(location) / Double(totalSize)) }

      let type = try self.type(object: tarObject, offset: location)
      switch type {
      case "0", "7": // File / contiguous file
        let name = try self.name(object: tarObject, offset: location)
        let filePath = try FileManager.containedPath(root: rootURL, entryName: name)
        let size = try self.size(object: tarObject, offset: location)
        guard size <= totalSize - dataStart else {
          throw UntarError.truncatedArchive
        }
        if size > 0 {
          blockCount += (size - 1) / FileManager.tarBlockSize + 1 // size / tarBlockSize rounded up
        }
        // Only files under package/ are read back; never write anything else.
        guard FileManager.isPath(filePath, inside: packageURL) else { break }
        extractedSize += size
        guard extractedSize <= FileManager.tarMaxExtractedSize else {
          throw UntarError.sizeLimitExceeded(limit: FileManager.tarMaxExtractedSize)
        }
        if size == 0 { try "".write(toFile: filePath, atomically: true, encoding: .utf8) } else {
          try writeFileData(object: tarObject, location: dataStart, length: size, path: filePath)
        }
      case "5": // Directory
        let name = try self.name(object: tarObject, offset: location)
        let directoryPath = try FileManager.containedPath(root: rootURL, entryName: name)
        guard FileManager.isPath(directoryPath, inside: packageURL) else { break }
        try createDirectory(atPath: directoryPath, withIntermediateDirectories: true,
                            attributes: nil)
      case "\0": break // Null block
      case "1", "2", "3", "4", "6": // Hard link / symlink / char device / block device / FIFO
        throw UntarError.unsupportedEntry(type: type)
      case "x", "g": // Pax extended headers, not a file nor directory
        let size = try self.size(object: tarObject, offset: location)
        guard size <= totalSize - dataStart else {
          throw UntarError.truncatedArchive
        }
        blockCount += (size + FileManager.tarBlockSize - 1) / FileManager.tarBlockSize
      default: throw UntarError.corruptFile(type: type) // Not a tar type
      }
      location += blockCount * FileManager.tarBlockSize
    }
    return true
  }

  static func isPath(_ path: String, inside directory: URL) -> Bool {
    let directoryPath = directory.standardizedFileURL.path
    let prefix = directoryPath.hasSuffix("/") ? directoryPath : directoryPath + "/"
    return path == directoryPath || path.hasPrefix(prefix)
  }

  // Resolves a tar entry name under root, rejecting absolute names, ".." segments
  // and anything whose standardized path is not inside root.
  static func containedPath(root: URL, entryName: String) throws -> String {
    let components = entryName.split(separator: "/", omittingEmptySubsequences: false)
    guard !entryName.isEmpty, !entryName.hasPrefix("/"), !components.contains("..") else {
      throw UntarError.unsafeEntry(name: entryName)
    }
    let rootPath = root.standardizedFileURL.path
    let resolvedPath = root.appendingPathComponent(entryName).standardizedFileURL.path
    guard isPath(resolvedPath, inside: root) else {
      throw UntarError.unsafeEntry(name: entryName)
    }
    // Symlinks already on disk must not redirect the write outside root.
    let realRoot = root.resolvingSymlinksInPath()
    let realParent = URL(fileURLWithPath: resolvedPath).deletingLastPathComponent()
      .resolvingSymlinksInPath().path
    let isLink = (try? FileManager.default.attributesOfItem(atPath: resolvedPath)[.type]
      as? FileAttributeType) == .typeSymbolicLink
    guard resolvedPath == rootPath || isPath(realParent, inside: realRoot), !isLink else {
      throw UntarError.unsafeEntry(name: entryName)
    }
    return resolvedPath
  }

  private func type(object: Any, offset: UInt64) throws -> UnicodeScalar {
    let typeData = try data(object: object, location: offset + FileManager.tarTypePosition,
                            length: 1)
    return UnicodeScalar(typeData[typeData.startIndex])
  }

  private func name(object: Any, offset: UInt64) throws -> String {
    let nameField = try data(object: object, location: offset + FileManager.tarNamePosition,
                             length: FileManager.tarNameSize)
    let nameBytes = nameField.prefix { $0 != 0 }
    guard let name = String(data: nameBytes, encoding: .utf8) else {
      throw UntarError.unsafeEntry(name: nameBytes.base64EncodedString())
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
        throw UntarError.truncatedArchive
      }
      let start = data.startIndex + Int(location)
      return data.subdata(in: start ..< start + Int(length))
    } else if let fileHandle = object as? FileHandle {
      fileHandle.seek(toFileOffset: location)
      let chunk = autoreleasepool { // Needed to prevent heap overflow when reading large files
        fileHandle.readData(ofLength: Int(length))
      }
      guard UInt64(chunk.count) == length else {
        throw UntarError.truncatedArchive
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
      guard let size = (attributes[.size] as? NSNumber)?.uint64Value,
            let fileHandle = FileHandle(forReadingAtPath: tarPath) else {
        throw UntarError.notFound(file: tarPath)
      }
      let result = try createFilesAndDirectories(path: path, tarObject: fileHandle, size: size,
                                                 progress: progress)
      fileHandle.closeFile()
      return result
    }

    throw UntarError.notFound(file: tarPath)
  }
}
