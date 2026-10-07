package com.metamask.nativeModules.RNTarTest;

import androidx.test.core.app.ApplicationProvider;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import java.io.File;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import io.metamask.nativeModules.RNTar.RNTar;

@RunWith(JUnit4.class)
public class RNTarTest {
  private RNTar tar;
  private ReactApplicationContext reactContext;
  private Promise promise;

  @Before
  public void setUp() {
    reactContext = mock(ReactApplicationContext.class);
    tar = new RNTar(reactContext);
    promise = mock(Promise.class);
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

  @Test
  public void testUnTar_rejectsPathTraversalEntry() throws IOException, InterruptedException {
    // Archive contains "package/test.txt" and "package/../../traversal.txt"
    InputStream tgzResource = Thread.currentThread().getContextClassLoader().getResourceAsStream("pathTraversalTestTGZFile.tgz");
    CountDownLatch latch = new CountDownLatch(1);

    try {
      File tgzFile = new File(reactContext.getCacheDir(), "pathTraversalTestTGZFile.tgz");
      Files.copy(tgzResource, tgzFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      File outputDir = new File(reactContext.getCacheDir(), "traversal/output");
      File escapedFile = new File(outputDir.getParentFile(), "traversal.txt");
      escapedFile.delete();

      doAnswer(invocation -> {
        latch.countDown();
        return null;
      }).when(promise).reject(anyString(), any(Throwable.class));

      tar.unTar(tgzFile.getAbsolutePath(), outputDir.getAbsolutePath(), promise);

      if (!latch.await(5, TimeUnit.SECONDS)) {
        fail("Timed out waiting for unTar operation to reject");
      }

      verify(promise).reject(anyString(), any(Throwable.class));
      verify(promise, never()).resolve(any());
      assertFalse("Entry escaped the output directory: " + escapedFile.getAbsolutePath(), escapedFile.exists());
    } finally {
      tgzResource.close();
    }
  }

  @Test
  public void testUnTar_rejectsSymlinkEntry() throws IOException, InterruptedException {
    // Archive contains a symbolic link entry "package/link" -> "/data"
    InputStream tgzResource = Thread.currentThread().getContextClassLoader().getResourceAsStream("symlinkTestTGZFile.tgz");
    CountDownLatch latch = new CountDownLatch(1);

    try {
      File tgzFile = new File(reactContext.getCacheDir(), "symlinkTestTGZFile.tgz");
      Files.copy(tgzResource, tgzFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      File outputDir = new File(reactContext.getCacheDir(), "symlink/output");

      doAnswer(invocation -> {
        latch.countDown();
        return null;
      }).when(promise).reject(anyString(), any(Throwable.class));

      tar.unTar(tgzFile.getAbsolutePath(), outputDir.getAbsolutePath(), promise);

      if (!latch.await(5, TimeUnit.SECONDS)) {
        fail("Timed out waiting for unTar operation to reject");
      }

      verify(promise).reject(anyString(), any(Throwable.class));
      verify(promise, never()).resolve(any());
      assertFalse("Link entry was extracted", new File(outputDir, "package/link").exists());
    } finally {
      tgzResource.close();
    }
  }
}
