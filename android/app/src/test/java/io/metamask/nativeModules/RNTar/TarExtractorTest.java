package io.metamask.nativeModules.RNTar;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.apache.commons.compress.archivers.tar.TarConstants;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class TarExtractorTest {
  @Rule public TemporaryFolder tmp = new TemporaryFolder();

  private File sandbox;
  private File outputDir;

  @Before
  public void setUp() throws IOException {
    sandbox = tmp.newFolder("files");
    outputDir = new File(sandbox, "snaps/extract");
  }

  private interface Writer {
    void write(TarArchiveOutputStream tar) throws IOException;
  }

  private File archive(Writer writer) throws IOException {
    File file = new File(tmp.getRoot(), "archive-" + System.nanoTime() + ".tgz");
    try (OutputStream out = new GZIPOutputStream(new FileOutputStream(file));
         TarArchiveOutputStream tar = new TarArchiveOutputStream(out)) {
      tar.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
      writer.write(tar);
    }
    return file;
  }

  private static void addFile(TarArchiveOutputStream tar, String name, byte[] data)
      throws IOException {
    TarArchiveEntry entry = new TarArchiveEntry(name, true);
    entry.setSize(data.length);
    tar.putArchiveEntry(entry);
    tar.write(data);
    tar.closeArchiveEntry();
  }

  private static void addZeros(TarArchiveOutputStream tar, String name, long size)
      throws IOException {
    TarArchiveEntry entry = new TarArchiveEntry(name, true);
    entry.setSize(size);
    tar.putArchiveEntry(entry);
    byte[] chunk = new byte[64 * 1024];
    for (long written = 0; written < size; written += chunk.length) {
      tar.write(chunk, 0, (int) Math.min(chunk.length, size - written));
    }
    tar.closeArchiveEntry();
  }

  private void assertRejected(File archive, TarExtractor extractor) {
    try {
      extractor.extract(archive.getAbsolutePath(), outputDir.getAbsolutePath());
      fail("Expected the archive to be rejected");
    } catch (IOException expected) {
      // expected
    }
  }

  private static byte[] bytes(String s) {
    return s.getBytes(StandardCharsets.UTF_8);
  }

  @Test
  public void extractsRegularPackage() throws IOException {
    File archive = archive(tar -> {
      addFile(tar, "package/snap.manifest.json", bytes("{\"proposedName\":\"x\"}"));
      addFile(tar, "package/dist/bundle.js", bytes("module.exports = {};"));
    });

    String result = new TarExtractor().extract(archive.getAbsolutePath(), outputDir.getAbsolutePath());

    assertEquals(new File(outputDir, "package").getAbsolutePath(), result);
    assertEquals("module.exports = {};", new String(
        Files.readAllBytes(new File(outputDir, "package/dist/bundle.js").toPath()),
        StandardCharsets.UTF_8));
  }

  @Test
  public void allowsCurrentDirectoryEntry() throws IOException {
    File archive = archive(tar -> {
      tar.putArchiveEntry(new TarArchiveEntry("./"));
      tar.closeArchiveEntry();
      addFile(tar, "./package/index.js", bytes("ok"));
    });

    new TarExtractor().extract(archive.getAbsolutePath(), outputDir.getAbsolutePath());

    assertTrue(new File(outputDir, "package/index.js").isFile());
  }

  @Test
  public void rejectsParentDirectoryEntry() throws IOException {
    File archive = archive(tar -> {
      tar.putArchiveEntry(new TarArchiveEntry("../"));
      tar.closeArchiveEntry();
    });

    assertRejected(archive, new TarExtractor());
  }

  @Test
  public void rejectsParentTraversal() throws IOException {
    File archive = archive(tar -> {
      addFile(tar, "package/snap.manifest.json", bytes("{}"));
      addFile(tar, "../../escape.txt", bytes("pwned"));
    });

    assertRejected(archive, new TarExtractor());
    assertFalse(new File(sandbox, "escape.txt").exists());
    assertFalse(new File(tmp.getRoot(), "escape.txt").exists());
  }

  @Test
  public void rejectsTraversalInsideNestedPath() throws IOException {
    File archive = archive(tar ->
        addFile(tar, "package/../../../persistStore/persist:root", bytes("{}")));

    assertRejected(archive, new TarExtractor());
    assertFalse(new File(sandbox, "persistStore").exists());
  }

  @Test
  public void rejectsAbsolutePaths() throws IOException {
    File target = new File(sandbox, "absolute.txt");
    File archive = archive(tar -> addFile(tar, target.getAbsolutePath(), bytes("x")));

    assertRejected(archive, new TarExtractor());
    assertFalse(target.exists());
  }

  @Test
  public void rejectsSymlinkEntries() throws IOException {
    File archive = archive(tar -> {
      TarArchiveEntry link = new TarArchiveEntry("package/link", TarConstants.LF_SYMLINK);
      link.setLinkName("../../");
      tar.putArchiveEntry(link);
      tar.closeArchiveEntry();
      addFile(tar, "package/link/persistStore/persist:root", bytes("{}"));
    });

    assertRejected(archive, new TarExtractor());
    assertFalse(new File(sandbox, "persistStore").exists());
  }

  @Test
  public void rejectsHardlinkEntries() throws IOException {
    File archive = archive(tar -> {
      TarArchiveEntry link = new TarArchiveEntry("package/hard", TarConstants.LF_LINK);
      link.setLinkName("/etc/passwd");
      tar.putArchiveEntry(link);
      tar.closeArchiveEntry();
    });

    assertRejected(archive, new TarExtractor());
  }

  @Test
  public void rejectsTooManyEntries() throws IOException {
    File archive = archive(tar -> {
      for (int i = 0; i < 11; i++) {
        addFile(tar, "package/f" + i, bytes("x"));
      }
    });

    assertRejected(archive, new TarExtractor(1024 * 1024, 1024 * 1024, 10));
  }

  @Test
  public void rejectsDecompressionBomb() throws IOException {
    long size = TarExtractor.DEFAULT_MAX_EXTRACTED_BYTES + 1024 * 1024;
    File archive = archive(tar -> addZeros(tar, "package/zeros.bin", size));
    assertTrue(archive.length() < 1024 * 1024);

    assertRejected(archive, new TarExtractor());
    File partial = new File(outputDir, "package/zeros.bin");
    assertTrue(!partial.exists() || partial.length() <= TarExtractor.DEFAULT_MAX_EXTRACTED_BYTES);
  }

  @Test
  public void rejectsOversizedArchive() throws IOException {
    File archive = archive(tar -> addFile(tar, "package/a", new byte[4096]));

    assertRejected(archive, new TarExtractor(16, 1024 * 1024, 10));
  }

  @Test
  public void rejectsNonEmptyOutputDirectory() throws IOException {
    assertTrue(outputDir.mkdirs());
    assertTrue(new File(outputDir, "existing").createNewFile());
    File archive = archive(tar -> addFile(tar, "package/a", bytes("x")));

    assertRejected(archive, new TarExtractor());
  }
}
