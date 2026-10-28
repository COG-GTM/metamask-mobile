package io.metamask.nativeModules.RNTar;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;

/**
 * Extracts Snap tarballs (.tgz) while enforcing limits on the number of entries
 * and the total number of extracted bytes, and rejecting entries that would be
 * written outside of the output directory.
 */
public class TarExtractor {
  // Matches TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers (250 MB).
  public static final long DEFAULT_MAX_TOTAL_BYTES = 262144000L;
  public static final int DEFAULT_MAX_ENTRIES = 5000;

  public static class LimitExceededException extends IOException {
    public LimitExceededException(String message) {
      super(message);
    }
  }

  private final long maxTotalBytes;
  private final int maxEntries;

  public TarExtractor() {
    this(DEFAULT_MAX_TOTAL_BYTES, DEFAULT_MAX_ENTRIES);
  }

  public TarExtractor(long maxTotalBytes, int maxEntries) {
    this.maxTotalBytes = maxTotalBytes;
    this.maxEntries = maxEntries;
  }

  /**
   * Extracts the gzipped tarball at tgzPath into outputPath. On failure every
   * file created by this extraction is removed.
   *
   * @return the absolute path of the "package" directory inside outputPath.
   */
  public String extract(String tgzPath, String outputPath) throws IOException {
    File tgzFile = new File(tgzPath);
    if (!tgzFile.isFile()) {
      throw new IOException("The specified .tgz file does not exist.");
    }

    File outputDir = new File(outputPath);
    if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
      throw new IOException("Unable to create the output directory.");
    }
    if (!outputDir.canRead() || !outputDir.canWrite()) {
      throw new IOException("The output directory is not readable and/or writable.");
    }

    List<File> created = new ArrayList<>();
    try (InputStream fileInputStream = new FileInputStream(tgzFile);
         GZIPInputStream gzipInputStream = new GZIPInputStream(new BufferedInputStream(fileInputStream));
         TarArchiveInputStream tarInputStream = new TarArchiveInputStream(gzipInputStream)) {
      extractEntries(tarInputStream, outputDir.getCanonicalFile(), created);
    } catch (IOException | RuntimeException e) {
      deleteCreated(created);
      throw e;
    }
    return new File(outputDir, "package").getAbsolutePath();
  }

  private void extractEntries(TarArchiveInputStream tarInputStream, File outputDir,
                              List<File> created) throws IOException {
    String outputDirPrefix = outputDir.getPath() + File.separator;
    long totalBytes = 0;
    int entryCount = 0;
    byte[] buffer = new byte[8192];
    TarArchiveEntry entry;

    while ((entry = tarInputStream.getNextEntry()) != null) {
      entryCount++;
      if (entryCount > maxEntries) {
        throw new LimitExceededException("Tarball exceeds the limit of " + maxEntries + " entries.");
      }

      File outputFile = new File(outputDir, entry.getName()).getCanonicalFile();
      if (!outputFile.getPath().startsWith(outputDirPrefix)) {
        throw new IOException("Tarball entry is outside of the output directory: " + entry.getName());
      }

      if (entry.isDirectory()) {
        createDirectories(outputFile, created);
        continue;
      }
      if (!entry.isFile()) {
        // Links, devices and FIFOs are not part of Snap packages.
        continue;
      }

      long remaining = maxTotalBytes - totalBytes;
      if (entry.getSize() > remaining) {
        throw new LimitExceededException("Tarball exceeds the limit of " + maxTotalBytes + " bytes.");
      }

      createDirectories(outputFile.getParentFile(), created);
      created.add(outputFile);
      try (OutputStream dest = new BufferedOutputStream(new FileOutputStream(outputFile))) {
        int length;
        while ((length = tarInputStream.read(buffer)) != -1) {
          if (length > remaining) {
            throw new LimitExceededException("Tarball exceeds the limit of " + maxTotalBytes + " bytes.");
          }
          dest.write(buffer, 0, length);
          remaining -= length;
          totalBytes += length;
        }
      }
    }
  }

  private static void createDirectories(File dir, List<File> created) throws IOException {
    if (dir == null || dir.isDirectory()) {
      return;
    }
    createDirectories(dir.getParentFile(), created);
    if (!dir.mkdir() && !dir.isDirectory()) {
      throw new IOException("Unable to create directory " + dir.getPath());
    }
    created.add(dir);
  }

  private static void deleteCreated(List<File> created) {
    for (int i = created.size() - 1; i >= 0; i--) {
      // noinspection ResultOfMethodCallIgnored
      created.get(i).delete();
    }
  }
}
