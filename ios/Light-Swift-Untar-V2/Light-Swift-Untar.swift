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
  case invalidEntryName(name: String)
  case tooManyEntries(limit: Int)
  case tooLarge(limit: UInt64)
  public var errorDescription: String? {
    switch self {
    case let .notFound(file: file): return "Source file \(file) not found"
    case let .corruptFile(type: type): return "Invalid block type \(type) found"
    case .truncated: return "Tar archive is truncated"
    case let .invalidEntryName(name: name): return "Invalid tar entry name \(name)"
    case let .tooManyEntries(limit: limit): return "Tar archive exceeds the limit of \(limit) entries"
    case let .tooLarge(limit: limit): return "Tar archive exceeds the limit of \(limit) bytes"
    }
  }
}

public struct UntarLimits {
  let maxEntries: Int
  let maxTotalBytes: UInt64
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
    var created: [String] = []
    do {
      try extractEntries(path: path, tarObject: tarObject, size: size, limits: limits,
                         created: &created, progress: progressClosure)
    } catch {
      for createdPath in created.reversed() {
        try? removeItem(atPath: createdPath)
      }
      throw error
    }
    return true
  }

  private func extractEntries(path: String, tarObject: Any, size tarSize: UInt64,
                              limits: UntarLimits?, created: inout [String],
                              progress progressClosure: Closure?) throws {
    var location: UInt64 = 0
    var entryCount = 0
    var totalBytes: UInt64 = 0
    while location < tarSize {
      var blockCount: UInt64 = 1
      if let closure = progressClosure { closure(Double(location) / Double(tarSize)) }
      guard tarSize - location >= FileManager.tarBlockSize else { throw UntarError.truncated }

      let type = self.type(object: tarObject, offset: location)
      if type != "\0" {
        entryCount += 1
        if let limits = limits, entryCount > limits.maxEntries {
          throw UntarError.tooManyEntries(limit: limits.maxEntries)
        }
      }
      switch type {
      case "0": // File
        let name = try self.name(object: tarObject, offset: location)
        let filePath = try entryPath(base: path, name: name)
        let size = self.size(object: tarObject, offset: location)
        guard size <= tarSize - location - FileManager.tarBlockSize else {
          throw UntarError.truncated
        }
        totalBytes += size
        if let limits = limits, totalBytes > limits.maxTotalBytes {
          throw UntarError.tooLarge(limit: limits.maxTotalBytes)
        }
        trackMissingAncestor(of: filePath, created: &created)
        if size > 0 {
          blockCount += (size - 1) / FileManager.tarBlockSize + 1 // size / tarBlockSize rounded up
        }
        try writeFileData(object: tarObject, location: location + FileManager.tarBlockSize,
                          length: size, path: filePath)
      case "5": // Directory
        let name = try self.name(object: tarObject, offset: location)
        let directoryPath = try entryPath(base: path, name: name)
        trackMissingAncestor(of: directoryPath, created: &created)
        try createDirectory(atPath: directoryPath, withIntermediateDirectories: true,
                            attributes: nil)
      case "\0": break // Null block
      case "1": fallthrough
      case "2": fallthrough
      case "3": fallthrough
      case "4": fallthrough
      case "6": fallthrough
      case "7": fallthrough
      case "x": fallthrough // Extended (PAX) header
      case "g": // Not a file nor directory
        let size = self.size(object: tarObject, offset: location)
        guard size <= tarSize - location - FileManager.tarBlockSize else {
          throw UntarError.truncated
        }
        blockCount += (size + FileManager.tarBlockSize - 1) / FileManager.tarBlockSize
      default: throw UntarError.corruptFile(type: type) // Not a tar type
      }
      location += blockCount * FileManager.tarBlockSize
    }
  }

  // Records the top-most ancestor of `path` (or `path` itself) that does not exist yet,
  // so a failed extraction can remove everything it created.
  private func trackMissingAncestor(of path: String, created: inout [String]) {
    var missing: String?
    var current = path
    while !fileExists(atPath: current) {
      missing = current
      let parent = (current as NSString).deletingLastPathComponent
      if parent == current || parent.isEmpty { break }
      current = parent
    }
    if let missing = missing { created.append(missing) }
  }

  // Resolves a tar entry name below `base`, rejecting absolute and parent-relative names.
  private func entryPath(base: String, name: String) throws -> String {
    let components = name.split(separator: "/", omittingEmptySubsequences: true)
    guard !name.hasPrefix("/"), !components.isEmpty,
          !components.contains(where: { $0 == ".." }) else {
      throw UntarError.invalidEntryName(name: name)
    }
    return URL(fileURLWithPath: base).appendingPathComponent(name).path
  }

  private func type(object: Any, offset: UInt64) -> UnicodeScalar {
    let typeData = data(object: object, location: offset + FileManager.tarTypePosition, length: 1)!
    return UnicodeScalar([UInt8](typeData)[0])
  }

  private func name(object: Any, offset: UInt64) throws -> String {
    let nameBytes = [UInt8](data(object: object, location: offset + FileManager.tarNamePosition,
                                 length: FileManager.tarNameSize)!)
    let end = nameBytes.firstIndex(of: 0) ?? nameBytes.count
    guard let name = String(bytes: nameBytes[..<end], encoding: .utf8) else {
      throw UntarError.invalidEntryName(name: "<non-UTF-8>")
    }
    return name
  }

  private func size(object: Any, offset: UInt64) -> UInt64 {
    let sizeData = data(object: object, location: offset + FileManager.tarSizePosition,
                        length: FileManager.tarSizeSize)!
    let sizeString = String(data: sizeData, encoding: .ascii)!
    return strtoull(sizeString, nil, 8) // Size is an octal number, convert to decimal
  }

  private func writeFileData(object: Any, location _loc: UInt64, length _len: UInt64,
                             path: String) throws {
    let pathURL = URL(fileURLWithPath: path)
    let directoryPathURL = pathURL.deletingLastPathComponent()
    if !fileExists(atPath: directoryPathURL.path) {
      try createDirectory(atPath: directoryPathURL.path, withIntermediateDirectories: true)
    }
    if let data = object as? Data {
      createFile(atPath: path, contents: data.subdata(in: Int(_loc) ..< Int(_loc + _len)),
                 attributes: nil)
    } else if let fileHandle = object as? FileHandle {
      if NSData().write(toFile: path, atomically: false) {
        let destinationFile = FileHandle(forWritingAtPath: path)!
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

  private func data(object: Any, location: UInt64, length: UInt64) -> Data? {
    if let data = object as? Data {
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
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: path, tarObject: tarData, size: UInt64(tarData.count),
                                  limits: nil, progress: progress)
  }

  @discardableResult func createFilesAndDirectories(url: URL, tarData: Data,
                                                    progress: Closure? = nil) throws -> Bool {
    try createFilesAndDirectories(path: url.path, tarData: tarData, progress: progress)
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
