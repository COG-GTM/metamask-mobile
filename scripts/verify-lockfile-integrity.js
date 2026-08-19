#!/usr/bin/env node

// Validates every yarn.lock in the repository so that a tampered lockfile
// cannot silently point a dependency at an attacker-controlled tarball or an
// unpinned git ref.
//
// Rules enforced for each lockfile entry:
//   - `resolved` must be present.
//   - registry tarballs must come from an allowed npm registry host and carry
//     an `integrity` hash.
//   - git dependencies must come from an allowed git host and be pinned to a
//     full 40 character commit hash (a branch or tag can be moved after review).

const fs = require('fs');
const path = require('path');

const LOCKFILES = [
  'yarn.lock',
  'ppom/yarn.lock',
  '.github/scripts/yarn.lock',
  'scripts/generate-attributions/yarn.lock',
];

const ALLOWED_REGISTRY_HOSTS = ['registry.yarnpkg.com', 'registry.npmjs.org'];
const ALLOWED_GIT_HOSTS = ['github.com', 'codeload.github.com'];

const COMMIT_HASH_REGEX = /\b[0-9a-f]{40}\b/u;
const INTEGRITY_REGEX = /^sha(?:512|384|256|1)-/u;

function parseEntries(contents) {
  const entries = [];
  let current = null;

  for (const line of contents.split('\n')) {
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }
    if (!line.startsWith(' ')) {
      current = {
        descriptor: line.replace(/:$/u, ''),
        resolved: null,
        integrity: null,
      };
      entries.push(current);
      continue;
    }
    if (!current) {
      continue;
    }
    const field = line.trim();
    if (field.startsWith('resolved ')) {
      current.resolved = field.slice('resolved '.length).replace(/"/gu, '');
    } else if (field.startsWith('integrity ')) {
      current.integrity = field.slice('integrity '.length).replace(/"/gu, '');
    }
  }

  return entries;
}

function hostOf(resolved) {
  // Yarn writes git resolutions as `git+https://...`, which `new URL` parses
  // with a `git+https:` protocol but still exposes the host.
  try {
    return new URL(resolved).host;
  } catch (error) {
    return null;
  }
}

function checkEntry(entry) {
  const { descriptor, resolved, integrity } = entry;

  if (!resolved) {
    return `${descriptor}: missing "resolved" URL`;
  }

  const host = hostOf(resolved);
  if (!host) {
    return `${descriptor}: unparseable "resolved" URL ${resolved}`;
  }

  if (ALLOWED_GIT_HOSTS.includes(host)) {
    if (!COMMIT_HASH_REGEX.test(resolved)) {
      return `${descriptor}: git dependency is not pinned to a 40 character commit hash (${resolved})`;
    }
    return null;
  }

  if (!ALLOWED_REGISTRY_HOSTS.includes(host)) {
    return `${descriptor}: resolved from disallowed host "${host}" (${resolved})`;
  }

  if (!integrity) {
    return `${descriptor}: missing "integrity" hash`;
  }

  if (!INTEGRITY_REGEX.test(integrity)) {
    return `${descriptor}: unsupported "integrity" hash ${integrity}`;
  }

  return null;
}

function main() {
  const projectDirectory = path.resolve(__dirname, '..');
  const errors = [];
  let checked = 0;

  for (const lockfile of LOCKFILES) {
    const lockfilePath = path.join(projectDirectory, lockfile);
    if (!fs.existsSync(lockfilePath)) {
      errors.push(`${lockfile}: lockfile not found`);
      continue;
    }

    const entries = parseEntries(fs.readFileSync(lockfilePath, 'utf8'));
    if (entries.length === 0) {
      errors.push(`${lockfile}: no dependency entries found`);
      continue;
    }

    for (const entry of entries) {
      const error = checkEntry(entry);
      if (error) {
        errors.push(`${lockfile}: ${error}`);
      }
    }

    checked += entries.length;
    console.log(`✔ ${lockfile} (${entries.length} entries)`);
  }

  if (errors.length > 0) {
    console.error(
      `\n✘ Lockfile integrity check failed with ${errors.length} problem(s):`,
    );
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`\n✔ ${checked} lockfile entries verified`);
}

main();
