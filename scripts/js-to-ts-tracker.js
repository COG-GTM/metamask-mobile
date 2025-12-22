#!/usr/bin/env node
/**
 * JavaScript to TypeScript Migration Tracker
 *
 * This script generates a report of remaining JavaScript files in the app/ directory
 * and updates the MIGRATION_TRACKER.md file with current statistics.
 *
 * Usage: node scripts/js-to-ts-tracker.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TRACKER_FILE = path.join(__dirname, '..', 'MIGRATION_TRACKER.md');
const APP_DIR = path.join(__dirname, '..', 'app');

// Patterns to exclude from migration tracking
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /stories/,
  /mock/i,
  /__mocks__/,
  /\.config\./,
];

// Priority categories based on file paths
const PRIORITY_CATEGORIES = {
  P0: {
    name: 'Core Engine & Controllers',
    patterns: [/^app\/core\//],
    rationale: 'Central business logic, high dependency count',
  },
  P1: {
    name: 'Utilities & Helpers',
    patterns: [/^app\/util\//],
    rationale: 'Pure functions, provide types for dependents',
  },
  P2: {
    name: 'Navigation & Routing',
    patterns: [/^app\/components\/Nav\//],
    rationale: 'Critical for app flow',
  },
  P3: {
    name: 'UI Components',
    patterns: [
      /^app\/components\/UI\//,
      /^app\/components\/Views\//,
      /^app\/components\/Base\//,
    ],
    rationale: 'Leaf nodes, fewer dependencies',
  },
  P4: {
    name: 'Actions, Reducers, Store',
    patterns: [/^app\/actions\//, /^app\/reducers\//, /^app\/store\//],
    rationale: 'Redux integration, moderate complexity',
  },
  P5: {
    name: 'Other (constants, images, lib)',
    patterns: [/^app\/constants\//, /^app\/images\//, /^app\/lib\//],
    rationale: 'Lower priority, less critical',
  },
};

/**
 * Find all JavaScript files in the app directory
 * @returns {string[]} Array of file paths
 */
function getJsFiles() {
  try {
    const command = `find ${APP_DIR} -name "*.js" -o -name "*.jsx"`;
    const files = execSync(command, { encoding: 'utf8' });
    return files
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((file) => !EXCLUDE_PATTERNS.some((pattern) => pattern.test(file)))
      .map((file) => path.relative(path.join(__dirname, '..'), file))
      .sort();
  } catch (error) {
    console.error('Error finding JS files:', error.message);
    return [];
  }
}

/**
 * Get the priority category for a file
 * @param {string} filePath - The file path
 * @returns {string} Priority key (P0-P5) or 'P5' as default
 */
function getPriority(filePath) {
  for (const [priority, config] of Object.entries(PRIORITY_CATEGORIES)) {
    if (config.patterns.some((pattern) => pattern.test(filePath))) {
      return priority;
    }
  }
  return 'P5';
}

/**
 * Categorize files by priority
 * @param {string[]} files - Array of file paths
 * @returns {Object} Files grouped by priority
 */
function categorizeFiles(files) {
  const categorized = {};
  for (const priority of Object.keys(PRIORITY_CATEGORIES)) {
    categorized[priority] = [];
  }

  for (const file of files) {
    const priority = getPriority(file);
    categorized[priority].push(file);
  }

  return categorized;
}

/**
 * Generate the migration tracker markdown content
 * @param {Object} categorizedFiles - Files grouped by priority
 * @returns {string} Markdown content
 */
function generateTrackerContent(categorizedFiles) {
  const totalFiles = Object.values(categorizedFiles).flat().length;

  let content = `# JavaScript to TypeScript Migration Tracker

## Summary
- Total JS files: ${totalFiles}
- Converted: 0
- In Progress: 0
- Remaining: ${totalFiles}

## Priority Legend
| Priority | Category | Rationale |
|----------|----------|-----------|
`;

  for (const [priority, config] of Object.entries(PRIORITY_CATEGORIES)) {
    content += `| **${priority}** | ${config.name} | ${config.rationale} |\n`;
  }

  content += '\n## File List\n';

  for (const [priority, config] of Object.entries(PRIORITY_CATEGORIES)) {
    const files = categorizedFiles[priority];
    content += `\n### ${priority}: ${config.name} (${files.length} files)\n`;
    content += '| File Path | Status | Assigned | PR Link | Notes |\n';
    content += '|-----------|--------|----------|---------|-------|\n';

    for (const file of files) {
      content += `| ${file} | Todo | | | |\n`;
    }
  }

  return content;
}

/**
 * Print a summary report to console
 * @param {Object} categorizedFiles - Files grouped by priority
 */
function printReport(categorizedFiles) {
  console.log('\n=== JavaScript to TypeScript Migration Report ===\n');

  let total = 0;
  for (const [priority, config] of Object.entries(PRIORITY_CATEGORIES)) {
    const count = categorizedFiles[priority].length;
    total += count;
    console.log(`${priority} (${config.name}): ${count} files`);
  }

  console.log(`\nTotal JS files to migrate: ${total}`);
  console.log(`\nTracker file: ${TRACKER_FILE}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const updateTracker = args.includes('--update');

  console.log('Scanning for JavaScript files in app/ directory...');

  const jsFiles = getJsFiles();
  const categorizedFiles = categorizeFiles(jsFiles);

  printReport(categorizedFiles);

  if (updateTracker) {
    const content = generateTrackerContent(categorizedFiles);
    fs.writeFileSync(TRACKER_FILE, content, 'utf8');
    console.log(`\nUpdated ${TRACKER_FILE}`);
  } else {
    console.log('\nRun with --update flag to update MIGRATION_TRACKER.md');
  }
}

main();
