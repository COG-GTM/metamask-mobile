#!/usr/bin/env node
/**
 * Summarize per-file line coverage for a set of source paths.
 *
 * Usage: summarize-coverage-delta.js <paths-file> <coverage-json>
 *        <output-comment-md> <output-failed-flag>
 *
 * - <paths-file>: newline-delimited list of source file paths, relative to repo root.
 * - <coverage-json>: Jest --coverageReporters=json output (coverage-final.json).
 * - <output-comment-md>: destination for the sticky PR comment body.
 * - <output-failed-flag>: written as "1" if any changed file has <70% line
 *   coverage, "0" otherwise.
 *
 * Kept as a separate file rather than inlined in the workflow so that the
 * logic stays testable and avoids ${{ }} interpolation pitfalls.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LINE_COVERAGE_THRESHOLD = 70;

function readPaths(pathsFile) {
  return fs
    .readFileSync(pathsFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function loadCoverage(coverageFile) {
  if (!fs.existsSync(coverageFile)) {
    throw new Error(`coverage file not found: ${coverageFile}`);
  }
  return JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
}

function findFileCoverage(coverage, relPath, repoRoot) {
  const absPath = path.join(repoRoot, relPath);
  return coverage[absPath] || coverage[relPath] || null;
}

function computeLineCoverage(fileCoverage) {
  if (!fileCoverage || !fileCoverage.s || !fileCoverage.statementMap) {
    return null;
  }

  const coveredLines = new Set();
  const totalLines = new Set();

  for (const [statementId, hits] of Object.entries(fileCoverage.s)) {
    const statement = fileCoverage.statementMap[statementId];
    if (!statement || !statement.start || typeof statement.start.line !== 'number') {
      continue;
    }
    const line = statement.start.line;
    totalLines.add(line);
    if (hits > 0) {
      coveredLines.add(line);
    }
  }

  const total = totalLines.size;
  const covered = coveredLines.size;
  const pct = total === 0 ? 100 : (covered / total) * 100;

  return { total, covered, pct };
}

function main() {
  const [pathsFile, coverageFile, outputComment, outputFailed] = process.argv.slice(2);
  if (!pathsFile || !coverageFile || !outputComment || !outputFailed) {
    console.error(
      'Usage: summarize-coverage-delta.js <paths-file> <coverage-json> <output-comment-md> <output-failed-flag>',
    );
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const paths = readPaths(pathsFile);
  const coverage = loadCoverage(coverageFile);

  let failed = false;
  const rows = paths.map((relPath) => {
    const fileCoverage = findFileCoverage(coverage, relPath, repoRoot);
    const stats = computeLineCoverage(fileCoverage);
    if (!stats) {
      return { file: relPath, covered: 0, total: 0, pct: null };
    }
    if (stats.pct < LINE_COVERAGE_THRESHOLD) {
      failed = true;
    }
    return { file: relPath, ...stats };
  });

  const lines = [
    '### Per-PR coverage delta',
    '',
    '| File | Lines covered | % |',
    '| --- | --- | --- |',
  ];
  for (const row of rows) {
    const pctStr = row.pct === null ? 'n/a' : `${row.pct.toFixed(2)}%`;
    lines.push(`| \`${row.file}\` | ${row.covered}/${row.total} | ${pctStr} |`);
  }
  lines.push('');
  lines.push(
    failed
      ? `:x: One or more changed files are below the ${LINE_COVERAGE_THRESHOLD}% line-coverage threshold.`
      : `:white_check_mark: All changed files meet the ${LINE_COVERAGE_THRESHOLD}% line-coverage threshold.`,
  );

  const body = `${lines.join('\n')}\n`;
  fs.writeFileSync(outputComment, body);
  fs.writeFileSync(outputFailed, failed ? '1' : '0');
  process.stdout.write(body);
}

main();
