#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Regenerates MIGRATION_INVENTORY.md: every .js/.jsx file left under app/
 * (excluding tests, stories, mocks and snapshots), grouped by directory and
 * ordered leaf-first, i.e. files with the fewest internal dependents first.
 *
 * Usage: node scripts/js-ts-migration/generate-inventory.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
const OUTPUT_FILE = path.join(REPO_ROOT, 'MIGRATION_INVENTORY.md');

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const JS_EXTENSIONS = ['.js', '.jsx'];
// Metro resolves `./Foo` to `Foo.ios.js` / `Foo.android.js` / `Foo.native.js`
// before falling back to `Foo.js`.
const PLATFORM_SUFFIXES = ['', '.ios', '.android', '.native'];
const EXCLUDED_DIRECTORIES = new Set(['node_modules', '__snapshots__']);
const EXCLUDED_FILE_PATTERN =
  /(\.test\.|\.spec\.|\.stories\.|\.constants\.test|\.testUtils\.)/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) {
        walk(fullPath, files);
      }
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Tracked files only — generated-but-gitignored sources such as
 * `app/lib/ppom/ppom.html.js` are not ours to migrate.
 */
function trackedFiles() {
  return new Set(
    execFileSync('git', ['ls-files', '--', 'app'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\n')
      .filter(Boolean)
      .map((file) => path.resolve(REPO_ROOT, file)),
  );
}

/** Files that are in scope for the migration. */
function isMigrationCandidate(filePath) {
  const relativePath = path.relative(REPO_ROOT, filePath);
  return (
    JS_EXTENSIONS.includes(path.extname(filePath)) &&
    !EXCLUDED_FILE_PATTERN.test(path.basename(filePath)) &&
    !relativePath.includes('__mocks__')
  );
}

const IMPORT_PATTERN =
  /(?:import\s[^'"]*from\s*|import\s*|require\s*\(\s*|jest\.mock\s*\(\s*)['"]([^'"]+)['"]/g;

function extractSpecifiers(contents) {
  const specifiers = [];
  let match;
  while ((match = IMPORT_PATTERN.exec(contents)) !== null) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function existingFiles(candidates) {
  return candidates.filter(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function variants(base) {
  return PLATFORM_SUFFIXES.flatMap((suffix) =>
    SOURCE_EXTENSIONS.map((extension) => base + suffix + extension),
  );
}

/**
 * Resolves an import specifier to the files on disk it may load, mimicking
 * Metro/tsc resolution for relative imports, for `baseUrl: "."` rooted imports
 * (e.g. `app/util/number`) and for the `images/*` path alias. Package imports
 * resolve to an empty list.
 *
 * A specifier can resolve to more than one file: `./StyledButton` maps to both
 * `index.js` and `index.android.js`, and converting one means converting all of
 * them, so every platform variant is counted as depended upon.
 */
function resolveSpecifier(specifier, importerDir) {
  let base;
  if (specifier.startsWith('.')) {
    base = path.resolve(importerDir, specifier);
  } else if (specifier.startsWith('app/')) {
    base = path.resolve(REPO_ROOT, specifier);
  } else if (specifier.startsWith('images/')) {
    // tsconfig maps `images/*` to `./app/images/*`, so the prefix is kept.
    base = path.resolve(APP_DIR, specifier);
  } else {
    return [];
  }

  // Tiers mirror resolution precedence: an exact file wins over an extension
  // match, which wins over a directory index.
  for (const tier of [
    [base],
    variants(base),
    variants(path.join(base, 'index')),
  ]) {
    const matches = existingFiles(tier);
    if (matches.length > 0) {
      return matches;
    }
  }
  return [];
}

function buildDependentCounts(allFiles) {
  const dependents = new Map(allFiles.map((file) => [file, new Set()]));
  for (const file of allFiles) {
    const contents = fs.readFileSync(file, 'utf8');
    for (const specifier of extractSpecifiers(contents)) {
      for (const resolved of resolveSpecifier(specifier, path.dirname(file))) {
        if (resolved !== file && dependents.has(resolved)) {
          dependents.get(resolved).add(file);
        }
      }
    }
  }
  return dependents;
}

function formatTable(rows) {
  const lines = [
    '| File | Internal dependents | Lines |',
    '| --- | ---: | ---: |',
    ...rows.map(
      (row) => `| \`${row.file}\` | ${row.dependents} | ${row.lines} |`,
    ),
  ];
  return lines.join('\n');
}

function main() {
  const tracked = trackedFiles();
  const allFiles = walk(APP_DIR).filter((file) => tracked.has(file));
  const dependents = buildDependentCounts(allFiles);
  const candidates = allFiles.filter(isMigrationCandidate).map((file) => ({
    file: path.relative(REPO_ROOT, file),
    directory: path.relative(REPO_ROOT, path.dirname(file)),
    dependents: dependents.get(file).size,
    lines: fs.readFileSync(file, 'utf8').split('\n').length,
  }));

  const byDependents = (a, b) =>
    a.dependents - b.dependents || a.file.localeCompare(b.file);
  candidates.sort(byDependents);

  const groups = new Map();
  for (const candidate of candidates) {
    const group = groups.get(candidate.directory) ?? [];
    group.push(candidate);
    groups.set(candidate.directory, group);
  }
  const orderedGroups = [...groups.entries()].sort(
    (a, b) =>
      Math.min(...a[1].map((entry) => entry.dependents)) -
        Math.min(...b[1].map((entry) => entry.dependents)) ||
      b[1].length - a[1].length ||
      a[0].localeCompare(b[0]),
  );

  const leaves = candidates.filter((candidate) => candidate.dependents === 0);
  const sections = [
    '# JavaScript → TypeScript Migration Inventory',
    '',
    '> Generated by `node scripts/js-ts-migration/generate-inventory.js`. Re-run it after every batch of conversions.',
    '',
    `Files remaining: **${candidates.length}** \`.js\`/\`.jsx\` files across **${groups.size}** directories under \`app/\`.`,
    'Tests, stories, snapshots and `__mocks__` are excluded — convert those together with the module they cover.',
    '',
    '"Internal dependents" is the number of files under `app/` that import the file (relative or `app/`-rooted imports).',
    'Zero-dependent files are leaves: they can be converted in any order, in parallel, with no cross-PR conflicts.',
    `Leaf files: **${leaves.length}**.`,
    '',
    '## Conversion order (leaf-first)',
    '',
    'Work top-to-bottom. Within a batch, one file per PR keeps reviews small and lets several people work in parallel.',
    '',
    formatTable(candidates),
    '',
    '## Grouped by directory',
    '',
    ...orderedGroups.flatMap(([directory, entries]) => [
      `### \`${directory}\` — ${entries.length} file${
        entries.length === 1 ? '' : 's'
      }`,
      '',
      formatTable([...entries].sort(byDependents)),
      '',
    ]),
  ];

  fs.writeFileSync(OUTPUT_FILE, `${sections.join('\n')}\n`);
  console.log(
    `Wrote ${path.relative(REPO_ROOT, OUTPUT_FILE)}: ${
      candidates.length
    } files, ${groups.size} directories, ${leaves.length} leaves.`,
  );
}

main();
