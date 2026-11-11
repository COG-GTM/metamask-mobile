package com.metamask.nativeModules.RNTarTest;

import androidx.test.core.app.ApplicationProvider;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import java.io.File;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.Assert.fail;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import io.metamask.nativeModules.RNTar.RNTar;

@RunWith(JUnit4.class)
public class RNTarTest {
  private RNTar tar;
  private ReactApplicationContext reactContext;
  private Promise promise;
  private File workDir;

  @Before
  public void setUp() {
    reactContext = mock(ReactApplicationContext.class);
    tar = new RNTar(reactContext);
    promise = mock(Promise.class);
  }

  @After
  public void tearDown() throws IOException {
    if (workDir != null && workDir.exists()) {
      Files.walk(workDir.toPath())
          .sorted(Comparator.reverseOrder())
          .map(Path::toFile)
          .forEach(File::delete);
    }
  }

  @Test
  public void testUnTar_validTgzFile() throws IOException, InterruptedException {
    // Prepare a sample .tgz file
    InputStream tgzResource = Thread.currentThread().getContextClassLoader().getResourceAsStream("validTestTGZFile.tgz");
    CountDownLatch latch = new CountDownLatch(1); // Create a CountDownLatch

    try {
      File tgzFile = new File(reactContext.getCacheDir(), "validTestTGZFile.tgz");
      Files.copy(tgzResource, tgzFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      String outputPath = reactContext.getCacheDir().getAbsolutePath() + "/output";

      // Set up the promise to count down the latch when resolved
      doAnswer(invocation -> {
        latch.countDown();
        return null;
      }).when(promise).resolve(anyString());

      // Call unTar method
      tar.unTar(tgzFile.getAbsolutePath(), outputPath, promise);

      // Wait for the background operation to complete
      if (!latch.await(5, TimeUnit.SECONDS)) {
        fail("Timed out waiting for unTar operation to complete");
      }

      // Verify the promise was resolved with the expected path
      Path expectedDecompressedPath = Paths.get(outputPath, "package");
      verify(promise).resolve(expectedDecompressedPath.toString());

      // verify the filename is properly parsed
      File outputDir = new File(outputPath, "package");
      String expectedFilename = "test.txt";
      File extractedFile = new File(outputDir, expectedFilename);
      assertTrue("Extracted file with correct filename does not exist: " + extractedFile.getAbsolutePath(), extractedFile.exists());

      // Read the content of the file
      String fileContent = new String(Files.readAllBytes(extractedFile.toPath()), StandardCharsets.UTF_8);

      // Assert that the file content is as expected
      String expectedContent = "testing";
      assertEquals("Extracted file content does not match expected content", expectedContent, fileContent.trim());
    } finally {
      tgzResource.close();
    }
  }

  private static void writeTgz(File tgzFile, String[] names, long[] sizes) throws IOException {
    byte[] zeros = new byte[64 * 1024];
    try (TarArchiveOutputStream tar = new TarArchiveOutputStream(
        new GZIPOutputStream(new FileOutputStream(tgzFile)))) {
      tar.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_POSIX);
      for (int i = 0; i < names.length; i++) {
        TarArchiveEntry entry = new TarArchiveEntry(names[i]);
        entry.setSize(sizes[i]);
        tar.putArchiveEntry(entry);
        long remaining = sizes[i];
        while (remaining > 0) {
          int chunk = (int) Math.min(zeros.length, remaining);
          tar.write(zeros, 0, chunk);
          remaining -= chunk;
        }
        tar.closeArchiveEntry();
      }
    }
  }

  private void assertUnTarRejectedAndCleanedUp(File tgzFile, File outputDir) throws InterruptedException {
    CountDownLatch latch = new CountDownLatch(1);
    doAnswer(invocation -> {
      latch.countDown();
      return null;
    }).when(promise).reject(anyString(), any(Throwable.class));
    doAnswer(invocation -> {
      latch.countDown();
      return null;
    }).when(promise).resolve(anyString());

    tar.unTar(tgzFile.getAbsolutePath(), outputDir.getAbsolutePath(), promise);

    if (!latch.await(120, TimeUnit.SECONDS)) {
      fail("Timed out waiting for unTar operation to complete");
    }
    verify(promise).reject(anyString(), any(Throwable.class));
    verify(promise, never()).resolve(anyString());
    assertFalse("Partial extraction output was left on disk: " + outputDir, outputDir.exists());
  }

  @Test
  public void testUnTar_rejectsEntryExpandingPastSizeLimit() throws IOException, InterruptedException {
    workDir = Files.createTempDirectory("rntar").toFile();
    File tgzFile = new File(workDir, "bomb.tgz");
    writeTgz(tgzFile, new String[] { "package/bomb.bin" }, new long[] { RNTar.MAX_EXTRACTED_BYTES + 1 });
    assertTrue("Test archive should be small when compressed", tgzFile.length() < 1024 * 1024);

    assertUnTarRejectedAndCleanedUp(tgzFile, new File(workDir, "output"));
  }

  @Test
  public void testUnTar_rejectsEntriesExpandingPastTotalSizeLimit() throws IOException, InterruptedException {
    workDir = Files.createTempDirectory("rntar").toFile();
    File tgzFile = new File(workDir, "bomb.tgz");
    long half = RNTar.MAX_EXTRACTED_BYTES / 2;
    writeTgz(
        tgzFile,
        new String[] { "package/a.bin", "package/b.bin", "package/c.bin" },
        new long[] { half, half, 1 });

    assertUnTarRejectedAndCleanedUp(tgzFile, new File(workDir, "output"));
  }

  @Test
  public void testUnTar_rejectsTooManyEntries() throws IOException, InterruptedException {
    workDir = Files.createTempDirectory("rntar").toFile();
    File tgzFile = new File(workDir, "many.tgz");
    int count = RNTar.MAX_ENTRIES + 1;
    String[] names = new String[count];
    long[] sizes = new long[count];
    for (int i = 0; i < count; i++) {
      names[i] = "package/f" + i;
    }
    writeTgz(tgzFile, names, sizes);

    assertUnTarRejectedAndCleanedUp(tgzFile, new File(workDir, "output"));
  }

  @Test
  public void testUnTar_rejectsOversizedArchive() throws IOException, InterruptedException {
    workDir = Files.createTempDirectory("rntar").toFile();
    File tgzFile = new File(workDir, "large.tgz");
    try (RandomAccessFile file = new RandomAccessFile(tgzFile, "rw")) {
      file.setLength(RNTar.MAX_ARCHIVE_BYTES + 1);
    }

    assertUnTarRejectedAndCleanedUp(tgzFile, new File(workDir, "output"));
  }
}
