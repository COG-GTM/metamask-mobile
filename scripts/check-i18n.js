#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Maximum number of missing keys allowed per locale before the script exits
// with a non-zero status.  Override via the I18N_THRESHOLD environment variable.
const MISSING_KEY_THRESHOLD = parseInt(
  process.env.I18N_THRESHOLD || '50',
  10,
);

// Locale codes that are actively imported in locales/i18n.js.
// Variant files (e.g. hi-in.json, pt-br.json) exist for Crowdin but are not
// loaded at runtime, so we only enforce completeness on these primary locales.
const PRIMARY_LOCALES = [
  'de', 'el', 'en', 'es', 'fr', 'hi', 'id',
  'ja', 'ko', 'pt', 'ru', 'tl', 'tr', 'vi', 'zh',
];

const LOCALES_DIR = path.resolve(__dirname, '..', 'locales', 'languages');
const APP_DIR = path.resolve(__dirname, '..', 'app');
const EN_FILE = path.join(LOCALES_DIR, 'en.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into dot-separated keys.
 *
 * @param {object} obj  - The object to flatten.
 * @param {string} prefix - Current key prefix (used during recursion).
 * @returns {string[]} Array of dot-separated key paths.
 */
function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Read and parse a JSON locale file.
 *
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {object} Parsed JSON content.
 */
function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Recursively collect all files matching the given extensions under a
 * directory.
 *
 * @param {string} dir - Directory to walk.
 * @param {string[]} extensions - File extensions to include (e.g. ['.js', '.ts']).
 * @returns {string[]} Array of absolute file paths.
 */
function walkDir(dir, extensions) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common non-source directories
      if (entry.name === 'node_modules' || entry.name === '__mocks__') {
        continue;
      }
      results = results.concat(walkDir(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Load the reference (English) locale
  const enData = loadJSON(EN_FILE);
  const enKeys = new Set(flattenKeys(enData));

  console.log(`\nReference locale (en): ${enKeys.size} keys\n`);

  // 2. Discover primary locale files (skip en.json and variant locales)
  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => {
      if (!f.endsWith('.json') || f === 'en.json') return false;
      const code = f.replace('.json', '');
      return PRIMARY_LOCALES.includes(code);
    });

  // 3. Check each locale for missing keys
  let hasThresholdViolation = false;
  const localeSummaries = [];

  for (const file of localeFiles) {
    const filePath = path.join(LOCALES_DIR, file);
    const localeData = loadJSON(filePath);
    const localeKeys = new Set(flattenKeys(localeData));

    const missing = [...enKeys].filter((k) => !localeKeys.has(k));

    localeSummaries.push({ file, missing: missing.length });

    if (missing.length > 0) {
      console.log(`[${file}] Missing ${missing.length} key(s):`);
      for (const key of missing) {
        console.log(`  - ${key}`);
      }
      console.log();
    }

    if (missing.length > MISSING_KEY_THRESHOLD) {
      hasThresholdViolation = true;
    }
  }

  // Summary table
  console.log('--- Locale Summary ---');
  console.log(
    `${'Locale'.padEnd(20)} ${'Missing'.padStart(8)} ${'Status'.padStart(10)}`,
  );
  console.log('-'.repeat(40));
  for (const { file, missing } of localeSummaries) {
    const status = missing > MISSING_KEY_THRESHOLD ? 'FAIL' : 'OK';
    console.log(
      `${file.padEnd(20)} ${String(missing).padStart(8)} ${status.padStart(10)}`,
    );
  }
  console.log();

  // 4. Scan source code for strings('...') calls referencing unknown keys
  console.log('--- Source Code Key Usage Check ---\n');

  const sourceFiles = walkDir(APP_DIR, ['.js', '.jsx', '.ts', '.tsx']);
  // Match strings('key.path') or strings("key.path") — first argument only
  const stringsCallRegex = /\bstrings\(\s*['"]([^'"]+)['"]/g;

  const unknownKeys = new Map(); // key -> [file locations]

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = stringsCallRegex.exec(content)) !== null) {
      const key = match[1];
      if (!enKeys.has(key)) {
        const relativePath = path.relative(
          path.resolve(__dirname, '..'),
          filePath,
        );
        if (!unknownKeys.has(key)) {
          unknownKeys.set(key, []);
        }
        unknownKeys.get(key).push(relativePath);
      }
    }
  }

  let hasUnknownKeys = false;
  if (unknownKeys.size > 0) {
    hasUnknownKeys = true;
    console.log(
      `Found ${unknownKeys.size} key(s) referenced in source but missing from en.json:\n`,
    );
    for (const [key, locations] of unknownKeys) {
      console.log(`  "${key}"`);
      for (const loc of locations) {
        console.log(`    -> ${loc}`);
      }
    }
    console.log();
  } else {
    console.log(
      'All strings() calls reference keys present in en.json.\n',
    );
  }

  // 5. Exit with appropriate status
  if (hasUnknownKeys) {
    console.warn(
      `WARNING: Source code references ${unknownKeys.size} i18n key(s) not present in en.json.`,
    );
  }

  if (hasThresholdViolation) {
    console.error(
      `ERROR: One or more locales exceed the missing-key threshold of ${MISSING_KEY_THRESHOLD}.`,
    );
    process.exit(1);
  }

  console.log('All checks passed.');
}

main();
