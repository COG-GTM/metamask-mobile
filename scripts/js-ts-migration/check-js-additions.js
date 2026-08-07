#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Non-blocking migration guardrail: warns when a branch adds new `.js`/`.jsx`
 * files under `app/`, and reports how much of `app/` is still JavaScript.
 *
 * Always exits 0 — the blocking check lives in
 * `.github/scripts/fitness-functions` (`preventJavaScriptFileAdditions`).
 *
 * Usage: node scripts/js-ts-migration/check-js-additions.js [baseRef]
 */
const { execFileSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_BASE_REF = process.env.BASE_REF
  ? `origin/${process.env.BASE_REF}`
  : 'origin/main';
const APP_FOLDER_JS_REGEX = /^app\/.*\.(js|jsx)$/;

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function addedFiles(baseRef) {
  const mergeBase = git(['merge-base', baseRef, 'HEAD']);
  return git(['diff', '--diff-filter=A', '--name-only', mergeBase, 'HEAD'])
    .split('\n')
    .filter(Boolean);
}

function countAppFiles(pattern) {
  const files = git(['ls-files', '--', pattern]).split('\n').filter(Boolean);
  return files.filter((file) => !/(__snapshots__)/.test(file)).length;
}

function reportProgress() {
  const javascript =
    countAppFiles('app/**/*.js') + countAppFiles('app/**/*.jsx');
  const typescript =
    countAppFiles('app/**/*.ts') + countAppFiles('app/**/*.tsx');
  const total = javascript + typescript;
  const percentage = total === 0 ? 100 : ((typescript / total) * 100).toFixed(1);
  console.log(
    `TypeScript coverage of app/: ${typescript}/${total} files (${percentage}%), ${javascript} JavaScript files left.`,
  );
  console.log('See MIGRATION.md for the per-file conversion checklist.');
}

function main() {
  const baseRef = process.argv[2] || DEFAULT_BASE_REF;

  let added;
  try {
    added = addedFiles(baseRef);
  } catch (error) {
    console.log(
      `Skipping new-JavaScript-file check: cannot diff against "${baseRef}" (${error.message.trim()}).`,
    );
    reportProgress();
    return;
  }

  const newJavaScriptFiles = added.filter((file) =>
    APP_FOLDER_JS_REGEX.test(file),
  );

  if (newJavaScriptFiles.length > 0) {
    console.log(
      `::warning::${newJavaScriptFiles.length} new JavaScript file(s) added under app/. New files in app/ should be written in TypeScript:`,
    );
    for (const file of newJavaScriptFiles) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log(`No new .js/.jsx files added under app/ since ${baseRef}.`);
  }

  reportProgress();
}

main();
