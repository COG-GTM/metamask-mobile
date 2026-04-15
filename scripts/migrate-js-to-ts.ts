#!/usr/bin/env ts-node
// Migrated from JS to TS — TODO: add proper types
/**
 * Automated JS-to-TS Migration Script
 *
 * Automates the mechanical parts of converting a JS file to TypeScript:
 * 1. Renames .js -> .ts (or .jsx -> .tsx if JSX is detected)
 * 2. Scans app/ for import statements referencing the old path and updates them
 * 3. Adds a TypeScript header comment
 * 4. Runs tsc --noEmit on the converted file to report initial type errors
 * 5. Outputs a summary
 *
 * Usage:
 *   yarn migrate-js-to-ts <file-path-or-glob>
 *
 * Examples:
 *   yarn migrate-js-to-ts app/reducers/alert/index.js
 *   yarn migrate-js-to-ts "app/reducers/*/index.js"
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// Reuse the pattern from fitness functions for identifying JS files in app/
const APP_FOLDER_JS_REGEX = /^(app).*\.(js|jsx)$/;

// Patterns that indicate JSX usage
const JSX_PATTERNS = [
  /<[A-Z][A-Za-z0-9.]*[\s/>]/,  // <Component or <Component>
  /React\.createElement\(/,       // React.createElement(
  /<\/[A-Za-z][A-Za-z0-9.]*>/,   // </Component>
  /<>[^]*<\/>/s,                  // <> fragment shorthand
];

const TS_HEADER_COMMENT = '// Migrated from JS to TS — TODO: add proper types\n';

interface MigrationResult {
  originalPath: string;
  newPath: string;
  importsUpdated: number;
  typeErrors: string[];
  success: boolean;
}

/**
 * Detect if file content contains JSX syntax
 */
function containsJSX(content: string): boolean {
  return JSX_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Get the new file extension based on content
 */
function getNewExtension(filePath: string, content: string): string {
  const ext = path.extname(filePath);
  if (ext === '.jsx' || (ext === '.js' && containsJSX(content))) {
    return '.tsx';
  }
  return '.ts';
}

/**
 * Recursively find all .js, .jsx, .ts, and .tsx files under a directory
 */
function findSourceFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (
          entry.name === 'node_modules' ||
          entry.name.startsWith('.') ||
          entry.name === 'ios' ||
          entry.name === 'android'
        ) {
          continue;
        }
        walk(fullPath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Update import statements in a file that reference the old path
 */
function updateImportsInFile(
  filePath: string,
  oldImportPath: string,
  newImportPath: string,
): boolean {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return false;
  }

  // Build regex patterns for various import/require forms
  // Match: import ... from 'oldPath' or require('oldPath')
  // The oldImportPath should be matched with or without extension
  const oldPathNoExt = oldImportPath.replace(/\.(js|jsx|ts|tsx)$/, '');
  const oldPathWithExt = oldImportPath;

  // Escape special regex characters in the path
  const escapeRegex = (s: string): string =>
    s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const escapedNoExt = escapeRegex(oldPathNoExt);
  const escapedWithExt = escapeRegex(oldPathWithExt);

  // Match import/require with the old path (with or without extension)
  const importRegex = new RegExp(
    `((?:import|export)\\s+[^;]*?from\\s+['"])` +
      `(${escapedWithExt}|${escapedNoExt})` +
      `(['"])`,
    'g',
  );

  const requireRegex = new RegExp(
    `(require\\s*\\(\\s*['"])` +
      `(${escapedWithExt}|${escapedNoExt})` +
      `(['"]\\s*\\))`,
    'g',
  );

  const newPathNoExt = newImportPath.replace(/\.(js|jsx|ts|tsx)$/, '');

  let updated = false;
  let newContent = content;

  newContent = newContent.replace(
    importRegex,
    (match: string, prefix: string, _oldPath: string, suffix: string) => {
      updated = true;
      return `${prefix}${newPathNoExt}${suffix}`;
    },
  );

  newContent = newContent.replace(
    requireRegex,
    (match: string, prefix: string, _oldPath: string, suffix: string) => {
      updated = true;
      return `${prefix}${newPathNoExt}${suffix}`;
    },
  );

  if (updated) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return updated;
}

/**
 * Compute the relative import path from one file to another
 */
function getRelativeImportPath(fromFile: string, toFile: string): string {
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, toFile);
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  // Normalize path separators for imports
  return relativePath.replace(/\\/g, '/');
}

/**
 * Run TypeScript compiler on a single file and capture errors
 */
function runTypeCheck(filePath: string): string[] {
  try {
    execSync(`npx tsc --noEmit --pretty false "${filePath}" 2>&1`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 60000,
    });
    return [];
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    const output = (execError.stdout || '') + (execError.stderr || '');
    return output
      .split('\n')
      .filter((line: string) => line.includes('error TS'))
      .slice(0, 20); // Limit to first 20 errors
  }
}

/**
 * Migrate a single JS/JSX file to TS/TSX
 */
function migrateFile(filePath: string): MigrationResult {
  const absolutePath = path.resolve(filePath);

  const ext = path.extname(absolutePath);
  if (ext !== '.js' && ext !== '.jsx') {
    console.error(`  Not a JS/JSX file: ${filePath}`);
    return {
      originalPath: filePath,
      newPath: filePath,
      importsUpdated: 0,
      typeErrors: [`Not a JS/JSX file: ${filePath}`],
      success: false,
    };
  }

  // Read original content
  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf-8');
  } catch {
    console.error(`  File not found: ${filePath}`);
    return {
      originalPath: filePath,
      newPath: filePath,
      importsUpdated: 0,
      typeErrors: [`File not found: ${filePath}`],
      success: false,
    };
  }
  const newExt = getNewExtension(absolutePath, content);
  const newPath = absolutePath.replace(/\.(js|jsx)$/, newExt);
  const newRelPath = path.relative(process.cwd(), newPath);

  console.log(`\n  Migrating: ${filePath}`);
  console.log(`    Extension: ${ext} -> ${newExt}`);

  // Step 1: Add TS header comment (only if not already present)
  let newContent = content;
  if (!content.startsWith(TS_HEADER_COMMENT.trim())) {
    // Insert after any shebang or initial comments
    const shebangMatch = content.match(/^#![^\n]*\n/);
    if (shebangMatch) {
      newContent =
        shebangMatch[0] + TS_HEADER_COMMENT + content.slice(shebangMatch[0].length);
    } else {
      newContent = TS_HEADER_COMMENT + content;
    }
  }

  // Step 2: Rename the file
  fs.writeFileSync(absolutePath, newContent, 'utf-8');
  fs.renameSync(absolutePath, newPath);
  console.log(`    Renamed: ${filePath} -> ${newRelPath}`);

  // Step 3: Scan app/ directory for imports referencing the old path
  const appDir = path.resolve('app');
  let importsUpdated = 0;

  try {
    const sourceFiles = findSourceFiles(appDir);
    const oldRelFromApp = path.relative(process.cwd(), absolutePath);
    const newRelFromApp = path.relative(process.cwd(), newPath);

    for (const sourceFile of sourceFiles) {
      if (sourceFile === newPath) continue; // Skip the migrated file itself

      const oldImportRel = getRelativeImportPath(sourceFile, absolutePath);
      const newImportRel = getRelativeImportPath(sourceFile, newPath);

      if (updateImportsInFile(sourceFile, oldImportRel, newImportRel)) {
        importsUpdated++;
      }
    }

    console.log(`    Imports updated: ${importsUpdated} file(s)`);
  } catch {
    // app/ directory not found; skip import updates
  }

  // Step 4: Run type check
  console.log(`    Running type check...`);
  const typeErrors = runTypeCheck(newPath);
  if (typeErrors.length === 0) {
    console.log(`    Type check: PASSED (no errors)`);
  } else {
    console.log(`    Type check: ${typeErrors.length} error(s) found`);
    typeErrors.forEach((err: string) => console.log(`      ${err}`));
  }

  return {
    originalPath: filePath,
    newPath: newRelPath,
    importsUpdated,
    typeErrors,
    success: true,
  };
}

// ---- Main ----
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: yarn migrate-js-to-ts <file-path-or-glob>');
    console.log('');
    console.log('Examples:');
    console.log('  yarn migrate-js-to-ts app/reducers/alert/index.js');
    console.log('  yarn migrate-js-to-ts "app/reducers/*/index.js"');
    process.exit(1);
  }

  const pattern = args[0];
  let files: string[];

  // Check if the argument is a glob pattern or a direct file path
  if (pattern.includes('*') || pattern.includes('?')) {
    files = await glob(pattern);
  } else {
    files = [pattern];
  }

  // Filter to only JS/JSX files
  files = files.filter((f: string) => /\.(js|jsx)$/.test(f));

  if (files.length === 0) {
    console.log('No JS/JSX files found matching the pattern.');
    process.exit(1);
  }

  console.log(`\n=== JS-to-TS Migration Script ===`);
  console.log(`Found ${files.length} file(s) to migrate.\n`);

  const results: MigrationResult[] = [];

  for (const file of files) {
    results.push(migrateFile(file));
  }

  // Print summary
  console.log(`\n\n=== Migration Summary ===`);
  console.log(`Total files processed: ${results.length}`);
  console.log(
    `Successful: ${results.filter((r: MigrationResult) => r.success).length}`,
  );
  console.log(
    `Failed: ${results.filter((r: MigrationResult) => !r.success).length}`,
  );
  console.log(
    `Total imports updated: ${results.reduce((sum: number, r: MigrationResult) => sum + r.importsUpdated, 0)}`,
  );

  const totalErrors = results.reduce(
    (sum: number, r: MigrationResult) => sum + r.typeErrors.length,
    0,
  );
  console.log(`Total type errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(`\nType errors need manual attention. Look for "TODO: add proper types" comments.`);
  }

  console.log(`\n--- Files ---`);
  for (const r of results) {
    const status = r.success ? 'OK' : 'FAIL';
    console.log(
      `  [${status}] ${r.originalPath} -> ${r.newPath} (${r.importsUpdated} imports, ${r.typeErrors.length} type errors)`,
    );
  }
}

main().catch((err: Error) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
