package com.metamask.nativeModules.RNTarTest;

import androidx.test.core.app.ApplicationProvider;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import org.junit.Before;
import org.junit.Test;
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
import static org.mockito.ArgumentMatchers.anyString;
import java.nio.file.StandardCopyOption;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import static org.junit.Assert.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
      File baseDir = Files.createTempDirectory("rntar-valid").toFile();
      File tgzFile = new File(baseDir, "validTestTGZFile.tgz");
      Files.copy(tgzResource, tgzFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      String outputPath = baseDir.getAbsolutePath() + "/output";

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

  private static final class TarEntrySpec {
    final String name;
    final byte type;
    final String contents;

    TarEntrySpec(String name, byte type, String contents) {
      this.name = name;
      this.type = type;
      this.contents = contents;
    }
  }

  private static TarEntrySpec file(String name, String contents) {
    return new TarEntrySpec(name, TarArchiveEntry.LF_NORMAL, contents);
  }

  private static File writeTgz(File dir, TarEntrySpec... specs) throws IOException {
    File tgz = new File(dir, "archive.tgz");
    try (OutputStream fos = new FileOutputStream(tgz);
         GZIPOutputStream gzip = new GZIPOutputStream(fos);
         TarArchiveOutputStream tar = new TarArchiveOutputStream(gzip)) {
      tar.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
      for (TarEntrySpec spec : specs) {
        TarArchiveEntry entry = new TarArchiveEntry(spec.name, spec.type, true);
        byte[] bytes = spec.contents.getBytes(StandardCharsets.UTF_8);
        if (spec.type == TarArchiveEntry.LF_SYMLINK) {
          entry.setLinkName(spec.contents);
        } else {
          entry.setSize(bytes.length);
        }
        tar.putArchiveEntry(entry);
        if (spec.type != TarArchiveEntry.LF_SYMLINK) {
          tar.write(bytes);
        }
        tar.closeArchiveEntry();
      }
    }
    return tgz;
  }

  // Runs unTar and returns null on success or the rejection error.
  private Throwable runUnTar(File tgz, File output) throws InterruptedException {
    Promise result = mock(Promise.class);
    CountDownLatch latch = new CountDownLatch(1);
    Throwable[] error = new Throwable[1];
    doAnswer(invocation -> {
      latch.countDown();
      return null;
    }).when(result).resolve(anyString());
    doAnswer(invocation -> {
      error[0] = invocation.getArgument(1);
      latch.countDown();
      return null;
    }).when(result).reject(anyString(), any(Throwable.class));
    tar.unTar(tgz.getAbsolutePath(), output.getAbsolutePath(), result);
    if (!latch.await(5, TimeUnit.SECONDS)) {
      fail("Timed out waiting for unTar operation to complete");
    }
    return error[0];
  }

  @Test
  public void testUnTar_rejectsParentTraversalEntries() throws Exception {
    File base = Files.createTempDirectory("rntar-traversal").toFile();
    File output = new File(base, "output");
    File tgz = writeTgz(base, file("package/index.js", "ok"), file("../evil.txt", "pwned"));

    Throwable error = runUnTar(tgz, output);

    assertTrue("Expected rejection for ../evil.txt", error != null);
    assertTrue(error.getMessage().contains("outside the destination"));
    assertFalse(new File(base, "evil.txt").exists());
  }

  @Test
  public void testUnTar_doesNotWriteEntriesOutsidePackage() throws Exception {
    File base = Files.createTempDirectory("rntar-outside-package").toFile();
    File output = new File(base, "output");
    File tgz = writeTgz(base,
        file("package/snap.manifest.json", "{}"),
        file("persistStore/persist-root", "{\"attacker\":true}"),
        file("package/../persistStore/persist-root", "{\"attacker\":true}"));

    Throwable error = runUnTar(tgz, output);

    assertTrue("Unexpected error: " + error, error == null);
    assertTrue(new File(output, "package/snap.manifest.json").exists());
    assertFalse(new File(output, "persistStore").exists());
    assertFalse(new File(base, "persistStore").exists());
  }

  @Test
  public void testUnTar_rejectsSymlinkEntries() throws Exception {
    File base = Files.createTempDirectory("rntar-symlink").toFile();
    File output = new File(base, "output");
    File tgz = writeTgz(base,
        new TarEntrySpec("package/link", TarArchiveEntry.LF_SYMLINK, "../../"),
        file("package/link/evil.txt", "pwned"));

    Throwable error = runUnTar(tgz, output);

    assertTrue("Expected rejection for symlink entry", error != null);
    assertTrue(error.getMessage().contains("Unsupported tar entry type"));
    assertFalse(new File(base, "evil.txt").exists());
  }

  @Test
  public void testUnTar_refusesNonEmptyOutputDirectory() throws Exception {
    File base = Files.createTempDirectory("rntar-non-empty").toFile();
    File output = new File(base, "output");
    assertTrue(new File(output, "persistStore").mkdirs());
    File tgz = writeTgz(base, file("package/index.js", "ok"));

    Throwable error = runUnTar(tgz, output);

    assertTrue("Expected rejection for non-empty output", error != null);
    assertTrue(error.getMessage().contains("must be new or empty"));
    assertFalse(new File(output, "package").exists());
  }
}
