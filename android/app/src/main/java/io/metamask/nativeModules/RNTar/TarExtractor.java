package io.metamask.nativeModules.RNTar;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.zip.GZIPInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;

/**
 * Extracts untrusted Snap npm tarballs into a dedicated, empty directory.
 * Rejects entries that would escape the output directory, link and special entries,
 * and archives that exceed the size or entry limits.
 */
final class TarExtractor {
  // Mirrors TARBALL_SIZE_SAFETY_LIMIT from @metamask/snaps-controllers.
  static final long TARBALL_SIZE_SAFETY_LIMIT = 262144000L;
  // Mirrors MAX_TARBALL_ENTRIES in app/core/Snaps/location/npm.ts.
  static final int MAX_TARBALL_ENTRIES = 5000;

  private final long maxCompressedSize;
  private final long maxExtractedSize;
  private final int maxEntries;

  TarExtractor() {
    this(TARBALL_SIZE_SAFETY_LIMIT, TARBALL_SIZE_SAFETY_LIMIT, MAX_TARBALL_ENTRIES);
  }

  TarExtractor(long maxCompressedSize, long maxExtractedSize, int maxEntries) {
    this.maxCompressedSize = maxCompressedSize;
    this.maxExtractedSize = maxExtractedSize;
    this.maxEntries = maxEntries;
  }

  String extract(String tgzPath, String outputPath) throws IOException {
    File tgzFile = new File(tgzPath);
    if (!tgzFile.isFile()) {
      throw new IOException("The specified .tgz file does not exist.");
    }
    if (tgzFile.length() > maxCompressedSize) {
      throw new IOException("The .tgz file exceeds the size limit of " + maxCompressedSize + " bytes.");
    }

    File outputDir = prepareOutputDirectory(outputPath);
    String canonicalOutputPrefix = outputDir.getCanonicalPath() + File.separator;

    long totalBytes = 0;
    int entryCount = 0;
    byte[] buffer = new byte[8192];

    try (InputStream fileInputStream = new FileInputStream(tgzFile);
         GZIPInputStream gzipInputStream = new GZIPInputStream(new BufferedInputStream(fileInputStream));
         TarArchiveInputStream tarInputStream = new TarArchiveInputStream(gzipInputStream)) {

      TarArchiveEntry entry;
      while ((entry = tarInputStream.getNextEntry()) != null) {
        entryCount++;
        if (entryCount > maxEntries) {
          throw new IOException("The tarball exceeds the limit of " + maxEntries + " entries.");
        }

        String entryName = entry.getName();
        if (entryName.startsWith("/") || entryName.contains("\\")
            || Arrays.asList(entryName.split("/")).contains("..")) {
          throw new IOException("Tarball entry is outside of the target directory: " + entryName);
        }
        File outputFile = new File(outputDir, entryName);
        String canonicalEntryPath = outputFile.getCanonicalPath();
        if (!canonicalEntryPath.startsWith(canonicalOutputPrefix)) {
          throw new IOException("Tarball entry is outside of the target directory: " + entryName);
        }

        if (entry.isDirectory()) {
          createDirectory(outputFile);
          continue;
        }
        if (!entry.isFile() || entry.isLink() || entry.isSymbolicLink()) {
          throw new IOException("Unsupported tarball entry type: " + entryName);
        }

        long remaining = maxExtractedSize - totalBytes;
        if (entry.getSize() < 0 || entry.getSize() > remaining) {
          throw new IOException("The tarball exceeds the extracted size limit of " + maxExtractedSize + " bytes.");
        }

        createDirectory(outputFile.getParentFile());
        try (OutputStream dest = new BufferedOutputStream(new FileOutputStream(outputFile))) {
          int length;
          while ((length = tarInputStream.read(buffer)) != -1) {
            totalBytes += length;
            if (totalBytes > maxExtractedSize) {
              throw new IOException("The tarball exceeds the extracted size limit of " + maxExtractedSize + " bytes.");
            }
            dest.write(buffer, 0, length);
          }
        }
      }
    }
    return new File(outputDir, "package").getAbsolutePath();
  }

  private static File prepareOutputDirectory(String outputPath) throws IOException {
    File outputDir = new File(outputPath);
    if (outputDir.exists()) {
      String[] contents = outputDir.list();
      if (!outputDir.isDirectory() || contents == null || contents.length > 0) {
        throw new IOException("The output directory must be a new, empty directory.");
      }
    } else if (!outputDir.mkdirs()) {
      throw new IOException("Unable to create the output directory.");
    }
    if (!outputDir.canRead() || !outputDir.canWrite()) {
      throw new IOException("The output directory is not readable and/or writable.");
    }
    return outputDir;
  }

  private static void createDirectory(File dir) throws IOException {
    if (dir != null && !dir.isDirectory() && !dir.mkdirs()) {
      throw new IOException("Unable to create directory: " + dir.getPath());
    }
  }
}
