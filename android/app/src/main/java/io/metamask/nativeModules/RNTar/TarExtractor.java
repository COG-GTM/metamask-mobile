package io.metamask.nativeModules.RNTar;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.GZIPInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;

/**
 * Extracts an untrusted .tgz (e.g. a Snap npm tarball) into a dedicated, empty directory.
 * Rejects the archive if any entry would resolve outside that directory, if it contains
 * links or special files, or if it exceeds the entry-count / size limits.
 */
public class TarExtractor {
  public static final long DEFAULT_MAX_ARCHIVE_BYTES = 250L * 1024 * 1024;
  public static final long DEFAULT_MAX_EXTRACTED_BYTES = 64L * 1024 * 1024;
  public static final int DEFAULT_MAX_ENTRIES = 5000;

  private final long maxArchiveBytes;
  private final long maxExtractedBytes;
  private final int maxEntries;

  public TarExtractor() {
    this(DEFAULT_MAX_ARCHIVE_BYTES, DEFAULT_MAX_EXTRACTED_BYTES, DEFAULT_MAX_ENTRIES);
  }

  public TarExtractor(long maxArchiveBytes, long maxExtractedBytes, int maxEntries) {
    this.maxArchiveBytes = maxArchiveBytes;
    this.maxExtractedBytes = maxExtractedBytes;
    this.maxEntries = maxEntries;
  }

  public String extract(String tgzPath, String outputPath) throws IOException {
    File archive = new File(tgzPath);
    if (!archive.isFile()) {
      throw new IOException("The specified .tgz file does not exist.");
    }
    if (archive.length() > maxArchiveBytes) {
      throw new IOException("The .tgz file exceeds the maximum allowed size.");
    }

    File outputDir = new File(outputPath);
    if (!outputDir.exists() && !outputDir.mkdirs()) {
      throw new IOException("Unable to create the output directory.");
    }
    if (!outputDir.isDirectory() || !outputDir.canRead() || !outputDir.canWrite()) {
      throw new IOException("The output directory is not readable and/or writable.");
    }
    String[] existing = outputDir.list();
    if (existing == null || existing.length != 0) {
      throw new IOException("The output directory must be empty.");
    }
    String canonicalRoot = outputDir.getCanonicalPath() + File.separator;

    try (InputStream fileInputStream = new FileInputStream(archive);
         GZIPInputStream gzipInputStream = new GZIPInputStream(new BufferedInputStream(fileInputStream));
         TarArchiveInputStream tarInputStream = new TarArchiveInputStream(gzipInputStream)) {

      TarArchiveEntry entry;
      int entryCount = 0;
      long extractedBytes = 0;
      byte[] buffer = new byte[8192];

      while ((entry = tarInputStream.getNextTarEntry()) != null) {
        if (++entryCount > maxEntries) {
          throw new IOException("The archive contains too many entries.");
        }
        if (entry.isSymbolicLink() || entry.isLink() || entry.isCharacterDevice()
            || entry.isBlockDevice() || entry.isFIFO()
            || (!entry.isDirectory() && !entry.isFile())) {
          throw new IOException("Unsupported tar entry type: " + entry.getName());
        }

        if (entry.isDirectory()) {
          File dir = resolveEntry(outputDir, canonicalRoot, entry.getName(), true);
          if (dir != null) {
            mkdirs(dir);
          }
          continue;
        }

        File outputFile = resolveEntry(outputDir, canonicalRoot, entry.getName(), false);

        mkdirs(outputFile.getParentFile());
        try (OutputStream dest = new BufferedOutputStream(new FileOutputStream(outputFile))) {
          int length;
          while ((length = tarInputStream.read(buffer)) != -1) {
            extractedBytes += length;
            if (extractedBytes > maxExtractedBytes) {
              throw new IOException("The archive exceeds the maximum extracted size.");
            }
            dest.write(buffer, 0, length);
          }
        }
      }
    }
    return new File(outputDir, "package").getAbsolutePath();
  }

  /**
   * Resolves an entry name under the output directory, rejecting anything that escapes it.
   * Returns null for directory entries that resolve to the output directory itself (e.g. "./").
   */
  static File resolveEntry(File outputDir, String canonicalRoot, String name, boolean allowRoot)
      throws IOException {
    if (name == null || name.isEmpty() || name.indexOf('\0') >= 0 || name.startsWith("/")
        || name.startsWith("\\")) {
      throw new IOException("Invalid tar entry name: " + name);
    }
    File outputFile = new File(outputDir, name);
    String canonicalPath = outputFile.getCanonicalPath();
    if (allowRoot && (canonicalPath + File.separator).equals(canonicalRoot)) {
      return null;
    }
    if (!canonicalPath.startsWith(canonicalRoot)) {
      throw new IOException("Tar entry is outside of the target directory: " + name);
    }
    return outputFile;
  }

  private static void mkdirs(File dir) throws IOException {
    if (dir != null && !dir.isDirectory() && !dir.mkdirs()) {
      throw new IOException("Unable to create directory: " + dir);
    }
  }
}
