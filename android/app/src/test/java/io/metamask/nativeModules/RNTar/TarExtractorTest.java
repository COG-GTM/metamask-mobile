package io.metamask.nativeModules.RNTar;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class TarExtractorTest {
  @Rule
  public TemporaryFolder tmp = new TemporaryFolder();

  private interface EntryWriter {
    void write(TarArchiveOutputStream tar) throws IOException;
  }

  private File tgz(EntryWriter writer) throws IOException {
    File file = tmp.newFile();
    try (OutputStream out = new GZIPOutputStream(new FileOutputStream(file));
         TarArchiveOutputStream tar = new TarArchiveOutputStream(out)) {
      tar.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
      tar.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_POSIX);
      writer.write(tar);
    }
    return file;
  }

  private static void addFile(TarArchiveOutputStream tar, String name, byte[] contents) throws IOException {
    TarArchiveEntry entry = new TarArchiveEntry(name);
    entry.setSize(contents.length);
    tar.putArchiveEntry(entry);
    tar.write(contents);
    tar.closeArchiveEntry();
  }

  private static void addZeroFile(TarArchiveOutputStream tar, String name, long size) throws IOException {
    TarArchiveEntry entry = new TarArchiveEntry(name);
    entry.setSize(size);
    tar.putArchiveEntry(entry);
    byte[] chunk = new byte[1 << 16];
    for (long left = size; left > 0; left -= chunk.length) {
      tar.write(chunk, 0, (int) Math.min(chunk.length, left));
    }
    tar.closeArchiveEntry();
  }

  private static long countFiles(File dir) {
    File[] children = dir.listFiles();
    long count = 0;
    if (children == null) {
      return 0;
    }
    for (File child : children) {
      count += 1 + countFiles(child);
    }
    return count;
  }

  @Test
  public void extractsSnapPackage() throws IOException {
    File archive = tgz(tar -> {
      addFile(tar, "package/snap.manifest.json", "{\"proposedName\":\"Example\"}".getBytes(StandardCharsets.UTF_8));
      addFile(tar, "package/dist/bundle.js", "module.exports = {};".getBytes(StandardCharsets.UTF_8));
    });
    File out = tmp.newFolder();

    String result = new TarExtractor().extract(archive.getPath(), out.getPath());

    assertEquals(new File(out, "package").getAbsolutePath(), result);
    assertEquals("module.exports = {};",
        new String(Files.readAllBytes(new File(out, "package/dist/bundle.js").toPath()), StandardCharsets.UTF_8));
  }

  @Test
  public void rejectsEntryWhoseDeclaredSizeExceedsBudgetWithoutWritingIt() throws IOException {
    // 300 MB of zeros compresses to well under 1 MB.
    File archive = tgz(tar -> addZeroFile(tar, "package/bomb.bin", 300L * 1024 * 1024));
    assertTrue(archive.length() < 1024 * 1024);
    File out = tmp.newFolder();

    assertThrows(TarExtractor.LimitExceededException.class,
        () -> new TarExtractor().extract(archive.getPath(), out.getPath()));
    assertEquals(0, countFiles(out));
  }

  @Test
  public void rejectsTarballWhoseTotalSizeExceedsBudgetAndCleansUp() throws IOException {
    File archive = tgz(tar -> {
      for (int i = 0; i < 4; i++) {
        addZeroFile(tar, "package/part" + i + ".bin", 400);
      }
    });
    File out = tmp.newFolder();

    assertThrows(TarExtractor.LimitExceededException.class,
        () -> new TarExtractor(1000, 100).extract(archive.getPath(), out.getPath()));
    assertEquals(0, countFiles(out));
  }

  @Test
  public void rejectsTarballWithTooManyEntries() throws IOException {
    File archive = tgz(tar -> {
      for (int i = 0; i < 11; i++) {
        addFile(tar, "package/f" + i, new byte[] {1});
      }
    });
    File out = tmp.newFolder();

    assertThrows(TarExtractor.LimitExceededException.class,
        () -> new TarExtractor(1000, 10).extract(archive.getPath(), out.getPath()));
    assertEquals(0, countFiles(out));
  }

  @Test
  public void rejectsEntriesOutsideOutputDirectory() throws IOException {
    File parent = tmp.newFolder();
    File out = new File(parent, "out");
    assertTrue(out.mkdir());
    File archive = tgz(tar -> addFile(tar, "../escaped.txt", new byte[] {1}));

    assertThrows(IOException.class, () -> new TarExtractor().extract(archive.getPath(), out.getPath()));
    assertFalse(new File(parent, "escaped.txt").exists());
  }

  @Test
  public void preservesExistingFilesInOutputDirectoryOnFailure() throws IOException {
    File out = tmp.newFolder();
    File existing = new File(out, "existing.txt");
    assertTrue(existing.createNewFile());
    File archive = tgz(tar -> addZeroFile(tar, "package/big.bin", 2000));

    assertThrows(TarExtractor.LimitExceededException.class,
        () -> new TarExtractor(1000, 100).extract(archive.getPath(), out.getPath()));
    assertTrue(existing.exists());
    assertFalse(new File(out, "package").exists());
    assertEquals(1, countFiles(out));
  }

  @Test
  public void leavesExistingPackageUntouchedWhenExtractionFails() throws IOException {
    File out = tmp.newFolder();
    File manifest = new File(out, "package/snap.manifest.json");
    assertTrue(manifest.getParentFile().mkdirs());
    Files.write(manifest.toPath(), "original".getBytes(StandardCharsets.UTF_8));
    File archive = tgz(tar -> {
      addFile(tar, "package/snap.manifest.json", "replaced".getBytes(StandardCharsets.UTF_8));
      addZeroFile(tar, "package/big.bin", 2000);
    });

    assertThrows(TarExtractor.LimitExceededException.class,
        () -> new TarExtractor(1000, 100).extract(archive.getPath(), out.getPath()));
    assertEquals("original", new String(Files.readAllBytes(manifest.toPath()), StandardCharsets.UTF_8));
    assertEquals(2, countFiles(out));
  }

  @Test
  public void onlyMovesPackageDirectoryIntoOutput() throws IOException {
    File out = tmp.newFolder();
    File other = new File(out, "other.txt");
    Files.write(other.toPath(), "original".getBytes(StandardCharsets.UTF_8));
    File archive = tgz(tar -> {
      addFile(tar, "other.txt", "replaced".getBytes(StandardCharsets.UTF_8));
      addFile(tar, "package/index.js", "ok".getBytes(StandardCharsets.UTF_8));
    });

    String packagePath = new TarExtractor().extract(archive.getPath(), out.getPath());
    assertEquals(new File(out, "package").getAbsolutePath(), packagePath);
    assertEquals("original", new String(Files.readAllBytes(other.toPath()), StandardCharsets.UTF_8));
    assertTrue(new File(out, "package/index.js").isFile());
    assertEquals(3, countFiles(out));
  }

  @Test
  public void replacesExistingPackageOnSuccess() throws IOException {
    File out = tmp.newFolder();
    File stale = new File(out, "package/stale.js");
    assertTrue(stale.getParentFile().mkdirs());
    assertTrue(stale.createNewFile());
    File archive = tgz(tar -> addFile(tar, "package/index.js", "ok".getBytes(StandardCharsets.UTF_8)));

    new TarExtractor().extract(archive.getPath(), out.getPath());
    assertFalse(stale.exists());
    assertTrue(new File(out, "package/index.js").isFile());
    assertEquals(2, countFiles(out));
  }
}
