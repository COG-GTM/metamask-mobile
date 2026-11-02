package io.metamask.nativeModules.RNTar;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import com.facebook.react.bridge.Promise;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import android.os.Build;

public class RNTar extends ReactContextBaseJavaModule {
  private static String MODULE_NAME = "RNTar";
  // Mirrors TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers.
  static final long MAX_EXTRACTED_BYTES = 262144000L;
  // npm tarballs keep every file under this top-level directory.
  static final String PACKAGE_DIRECTORY = "package";

  public RNTar(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private void createDirectories(String path) throws IOException {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Files.createDirectories(Paths.get(path));
    } else {
      File dir = new File(path);
      if (!dir.exists()) {
        dir.mkdirs();
      }
    }
  }

  private boolean isReadableWritable(String path) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Path dirPath = Paths.get(path);
      return Files.isReadable(dirPath) && Files.isWritable(dirPath);
    } else {
      File dir = new File(path);
      return dir.canRead() && dir.canWrite();
    }
  }

  private boolean exists(String path) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      return Files.exists(Paths.get(path));
    } else {
      return new File(path).exists();
    }
  }

  // Resolves a tar entry under outputDir, rejecting entries that escape it.
  static File containedFile(File outputDir, String entryName) throws IOException {
    String canonicalRoot = outputDir.getCanonicalPath();
    File outputFile = new File(outputDir, entryName);
    String canonicalPath = outputFile.getCanonicalPath();
    if (!canonicalPath.equals(canonicalRoot)
        && !canonicalPath.startsWith(canonicalRoot + File.separator)) {
      throw new IOException("Tar entry resolves outside the destination: " + entryName);
    }
    return new File(canonicalPath);
  }

  static boolean isInside(File file, File directory) throws IOException {
    String filePath = file.getCanonicalPath();
    String directoryPath = directory.getCanonicalPath();
    return filePath.equals(directoryPath) || filePath.startsWith(directoryPath + File.separator);
  }

  private String extractTgzFile(String tgzPath, String outputPath) throws IOException {
    try {
      // Check if .tgz file exists
      if (!exists(tgzPath)) {
        throw new IOException("The specified .tgz file does not exist.");
      }

      // Only extract into a new or empty directory so entries cannot overwrite existing app files
      String[] existingEntries = new File(outputPath).list();
      if (existingEntries != null && existingEntries.length > 0) {
        throw new IOException("The output directory must be new or empty.");
      }

      // Create output directory if it doesn't exist
      createDirectories(outputPath);
      File outputDir = new File(outputPath);
      File packageDir = new File(outputDir, PACKAGE_DIRECTORY);
      long extractedBytes = 0;

      // Check if the output directory is readable and writable
      if (!isReadableWritable(outputPath)) {
        throw new IOException("The output directory is not readable and/or writable.");
      }

      // Set up the input streams for reading the .tgz file
      try (FileInputStream fileInputStream = new FileInputStream(tgzPath);
           GZIPInputStream gzipInputStream = new GZIPInputStream(fileInputStream);
           TarArchiveInputStream tarInputStream = new TarArchiveInputStream(new BufferedInputStream(gzipInputStream))) {

        TarArchiveEntry entry;

        // Loop through the entries in the .tgz file
        while ((entry = (TarArchiveEntry) tarInputStream.getNextEntry()) != null) {
          if (entry.isSymbolicLink() || entry.isLink() || entry.isCharacterDevice()
              || entry.isBlockDevice() || entry.isFIFO()
              || !(entry.isDirectory() || entry.isFile())) {
            throw new IOException("Unsupported tar entry type: " + entry.getName());
          }
          File outputFile = containedFile(outputDir, entry.getName());
          // Only files under package/ are read back; never write anything else.
          if (!isInside(outputFile, packageDir)) {
            continue;
          }

          // If it is a directory, create the output directory
          if (entry.isDirectory()) {
            createDirectories(outputFile.getAbsolutePath());
          } else {
            // A later duplicate entry must not replace a file that was already extracted.
            if (outputFile.exists()) {
              throw new IOException("Duplicate tar entry: " + entry.getName());
            }
            // Create parent directories if they don't exist
            createDirectories(outputFile.getParent());

            // Set up the output streams for writing the file
            try (FileOutputStream fos = new FileOutputStream(outputFile);
                 BufferedOutputStream dest = new BufferedOutputStream(fos)) {

              // Read and write the file data as bytes
              byte[] buffer = new byte[4096];
              int length;
              while ((length = tarInputStream.read(buffer)) != -1) {
                extractedBytes += length;
                if (extractedBytes > MAX_EXTRACTED_BYTES) {
                  throw new IOException("Snap tarball exceeds limit of " + MAX_EXTRACTED_BYTES + " bytes.");
                }
                dest.write(buffer, 0, length);
              }
            }
          }
        }
      }
      // Return the output directory path
      return new File(outputPath, "package").getAbsolutePath();
    } catch (IOException e) {
      Log.e("DecompressTgzFile", "Error decompressing tgz file", e);
      throw new IOException("Error decompressing tgz file: " + e.getMessage(), e);
    }
  }

  @ReactMethod
  public void unTar(String pathToRead, String pathToWrite, final Promise promise) {
    Log.d(MODULE_NAME, "Create event called with name: " + pathToRead
      + " and location: " + pathToWrite);
    new Thread(() -> {
      try {
        String decompressedPath = extractTgzFile(pathToRead, pathToWrite);
        promise.resolve(decompressedPath);
      } catch(Exception e) {
        promise.reject("Error uncompressing file:", e);
      }
    }).start();
  }
}
