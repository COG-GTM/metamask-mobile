package io.metamask.nativeModules.RNTar;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
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
   * Extracts the gzipped tarball at tgzPath into a fresh staging directory and,
   * once every entry passed validation, moves its "package" directory to
   * outputPath/package. Nothing in outputPath is modified if extraction fails.
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

    File canonicalOutputDir = outputDir.getCanonicalFile();
    File stagingDir = new File(canonicalOutputDir, ".rntar-" + UUID.randomUUID());
    // The archive is extracted into stagingDir/extract so it can never collide
    // with stagingDir/previous-package, where the existing package is backed up.
    File extractDir = new File(stagingDir, "extract");
    if (!stagingDir.mkdir() || !extractDir.mkdir()) {
      deleteRecursively(stagingDir);
      throw new IOException("Unable to create the staging directory.");
    }
    try {
      try (InputStream fileInputStream = new FileInputStream(tgzFile);
           GZIPInputStream gzipInputStream = new GZIPInputStream(new BufferedInputStream(fileInputStream));
           TarArchiveInputStream tarInputStream = new TarArchiveInputStream(gzipInputStream)) {
        extractEntries(tarInputStream, extractDir);
      }

      File stagedPackage = new File(extractDir, "package");
      if (!stagedPackage.isDirectory()) {
        throw new IOException("Tarball does not contain a package directory.");
      }
      // Move any existing package aside (into the staging directory, which is
      // deleted afterwards) so it can be restored if the swap fails.
      File packageDir = new File(canonicalOutputDir, "package");
      File previousPackage = new File(stagingDir, "previous-package");
      boolean hadPackage = packageDir.exists();
      if (hadPackage && !packageDir.renameTo(previousPackage)) {
        throw new IOException("Unable to move the existing package aside.");
      }
      if (!stagedPackage.renameTo(packageDir)) {
        if (hadPackage) {
          // noinspection ResultOfMethodCallIgnored
          previousPackage.renameTo(packageDir);
        }
        throw new IOException("Unable to move the extracted package into place.");
      }
    } finally {
      deleteRecursively(stagingDir);
    }
    return new File(outputDir, "package").getAbsolutePath();
  }

  private void extractEntries(TarArchiveInputStream tarInputStream, File outputDir) throws IOException {
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
        createDirectories(outputFile);
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

      createDirectories(outputFile.getParentFile());
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

  private static void createDirectories(File dir) throws IOException {
    if (!dir.isDirectory() && !dir.mkdirs()) {
      throw new IOException("Unable to create directory " + dir.getPath());
    }
  }

  private static boolean isSymlink(File file) throws IOException {
    File parent = file.getParentFile();
    if (parent == null) {
      return false;
    }
    File resolved = new File(parent.getCanonicalFile(), file.getName());
    return !resolved.getCanonicalFile().equals(resolved.getAbsoluteFile());
  }

  private static void deleteRecursively(File file) throws IOException {
    if (file.isDirectory() && !isSymlink(file)) {
      File[] children = file.listFiles();
      if (children != null) {
        for (File child : children) {
          deleteRecursively(child);
        }
      }
    }
    // noinspection ResultOfMethodCallIgnored
    file.delete();
  }
}
