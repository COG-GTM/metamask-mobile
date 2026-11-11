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
import java.util.ArrayList;
import java.util.List;
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

  // Matches TARBALL_SIZE_SAFETY_LIMIT in @metamask/snaps-controllers.
  public static final long MAX_ARCHIVE_BYTES = 262144000L;
  public static final long MAX_EXTRACTED_BYTES = 262144000L;
  public static final int MAX_ENTRIES = 10000;

  public RNTar(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
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

  /**
   * Creates {@code dir} and any missing parents, recording every directory it
   * creates so a failed extraction can remove them again.
   */
  private void createTrackedDirectories(File dir, List<File> created) throws IOException {
    if (dir == null || dir.isDirectory()) {
      return;
    }
    createTrackedDirectories(dir.getParentFile(), created);
    if (!dir.mkdir() && !dir.isDirectory()) {
      throw new IOException("Unable to create directory: " + dir.getAbsolutePath());
    }
    created.add(dir);
  }

  private void deleteCreated(List<File> created) {
    for (int i = created.size() - 1; i >= 0; i--) {
      File file = created.get(i);
      if (file.exists() && !file.delete()) {
        Log.w(MODULE_NAME, "Unable to delete " + file.getAbsolutePath());
      }
    }
  }

  private String extractTgzFile(String tgzPath, String outputPath) throws IOException {
    List<File> created = new ArrayList<>();
    try {
      // Check if .tgz file exists
      if (!exists(tgzPath)) {
        throw new IOException("The specified .tgz file does not exist.");
      }

      if (new File(tgzPath).length() > MAX_ARCHIVE_BYTES) {
        throw new IOException("The .tgz file exceeds the maximum size of " + MAX_ARCHIVE_BYTES + " bytes.");
      }

      // Create output directory if it doesn't exist
      createTrackedDirectories(new File(outputPath), created);

      // Check if the output directory is readable and writable
      if (!isReadableWritable(outputPath)) {
        throw new IOException("The output directory is not readable and/or writable.");
      }

      // Set up the input streams for reading the .tgz file
      try (FileInputStream fileInputStream = new FileInputStream(tgzPath);
           GZIPInputStream gzipInputStream = new GZIPInputStream(fileInputStream);
           TarArchiveInputStream tarInputStream = new TarArchiveInputStream(new BufferedInputStream(gzipInputStream))) {

        TarArchiveEntry entry;
        int entryCount = 0;
        long extractedBytes = 0;
        byte[] buffer = new byte[4096];

        // Loop through the entries in the .tgz file
        while ((entry = (TarArchiveEntry) tarInputStream.getNextEntry()) != null) {
          if (++entryCount > MAX_ENTRIES) {
            throw new IOException("The .tgz file contains more than " + MAX_ENTRIES + " entries.");
          }
          File outputFile = new File(outputPath, entry.getName());

          // If it is a directory, create the output directory
          if (entry.isDirectory()) {
            createTrackedDirectories(outputFile, created);
          } else {
            if (entry.getSize() > MAX_EXTRACTED_BYTES - extractedBytes) {
              throw new IOException("The extracted contents exceed the maximum size of " + MAX_EXTRACTED_BYTES + " bytes.");
            }

            // Create parent directories if they don't exist
            createTrackedDirectories(outputFile.getParentFile(), created);

            if (!outputFile.exists()) {
              created.add(outputFile);
            }

            // Set up the output streams for writing the file
            try (FileOutputStream fos = new FileOutputStream(outputFile);
                 BufferedOutputStream dest = new BufferedOutputStream(fos)) {

              // Read and write the file data as bytes
              int length;
              while ((length = tarInputStream.read(buffer)) != -1) {
                extractedBytes += length;
                if (extractedBytes > MAX_EXTRACTED_BYTES) {
                  throw new IOException("The extracted contents exceed the maximum size of " + MAX_EXTRACTED_BYTES + " bytes.");
                }
                dest.write(buffer, 0, length);
              }
            }
          }
        }
      }
      // Return the output directory path
      return new File(outputPath, "package").getAbsolutePath();
    } catch (IOException | RuntimeException e) {
      deleteCreated(created);
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
