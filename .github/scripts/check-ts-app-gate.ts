import { readdirSync, statSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

// Root of the `app/` directory, relative to this script (`.github/scripts`).
const REPO_ROOT = resolve(__dirname, '..', '..');
const APP_DIR = join(REPO_ROOT, 'app');

// The migration converted all first-party source files in `app/` to TypeScript.
// Test files, mocks, snapshots and Storybook stories are intentionally still
// allowed to be JavaScript, so they are excluded from this gate.
const EXCLUDED_FILE_REGEXES: RegExp[] = [
  /\.(test|spec)\.(js|jsx)$/,
  /\.stories\.(js|jsx)$/,
];

const EXCLUDED_DIR_SEGMENTS = new Set(['__mocks__', '__snapshots__']);

const SOURCE_JS_REGEX = /\.(js|jsx)$/;

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (EXCLUDED_DIR_SEGMENTS.has(entry)) {
        continue;
      }
      walk(fullPath, acc);
      continue;
    }

    if (!SOURCE_JS_REGEX.test(entry)) {
      continue;
    }

    if (EXCLUDED_FILE_REGEXES.some((regex) => regex.test(entry))) {
      continue;
    }

    acc.push(fullPath);
  }

  return acc;
}

function main(): void {
  const offendingFiles = walk(APP_DIR, [])
    .map((file) => relative(REPO_ROOT, file).split(sep).join('/'))
    .sort();

  if (offendingFiles.length === 0) {
    console.log(
      'check-ts-app-gate: OK — no first-party JavaScript source files found in app/.',
    );
    return;
  }

  console.error(
    `check-ts-app-gate: FAILED — found ${offendingFiles.length} JavaScript ` +
      'source file(s) in app/. Convert them to TypeScript (.ts/.tsx):',
  );
  for (const file of offendingFiles) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

main();
