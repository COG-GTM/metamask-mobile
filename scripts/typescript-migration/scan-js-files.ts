#!/usr/bin/env ts-node
/**
 * TypeScript Migration Scanner
 *
 * This script scans the app/ directory and generates a comprehensive inventory
 * of all remaining JavaScript (.js and .jsx) files that need to be migrated
 * to TypeScript.
 *
 * Usage:
 *   npx ts-node scripts/typescript-migration/scan-js-files.ts
 *
 * Output:
 *   - Console summary of migration progress
 *   - JSON file with detailed file inventory (scripts/typescript-migration/js-files-inventory.json)
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  name: string;
  extension: string;
  category: string;
  directory: string;
  sizeBytes: number;
  complexity: 'low' | 'medium' | 'high';
}

interface DirectorySummary {
  directory: string;
  jsFileCount: number;
  tsFileCount: number;
  files: string[];
}

interface MigrationInventory {
  generatedAt: string;
  summary: {
    totalJsFiles: number;
    totalTsFiles: number;
    migrationProgress: string;
    byCategory: Record<string, number>;
    byComplexity: Record<string, number>;
  };
  directories: DirectorySummary[];
  files: FileInfo[];
}

const APP_DIR = path.join(__dirname, '../../app');
const OUTPUT_FILE = path.join(__dirname, 'js-files-inventory.json');

function categorizeFile(filePath: string): string {
  const relativePath = filePath.toLowerCase();

  if (relativePath.includes('__test__') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
    return 'test';
  }
  if (relativePath.includes('/reducers/') || relativePath.includes('reducer')) {
    return 'reducer';
  }
  if (relativePath.includes('/selectors/')) {
    return 'selector';
  }
  if (relativePath.includes('/actions/')) {
    return 'action';
  }
  if (relativePath.includes('/components/ui/')) {
    return 'ui-component';
  }
  if (relativePath.includes('/components/views/')) {
    return 'view-component';
  }
  if (relativePath.includes('/components/base/')) {
    return 'base-component';
  }
  if (relativePath.includes('/components/')) {
    return 'component';
  }
  if (relativePath.includes('/core/')) {
    return 'core';
  }
  if (relativePath.includes('/util/') || relativePath.includes('/utils/')) {
    return 'utility';
  }
  if (relativePath.includes('/hooks/')) {
    return 'hook';
  }
  if (relativePath.includes('/constants/')) {
    return 'constant';
  }
  if (relativePath.includes('/styles/') || relativePath.includes('style')) {
    return 'style';
  }
  if (relativePath.includes('/lib/')) {
    return 'library';
  }
  if (relativePath.includes('/images/')) {
    return 'asset';
  }

  return 'other';
}

function estimateComplexity(sizeBytes: number): 'low' | 'medium' | 'high' {
  if (sizeBytes < 2000) return 'low';
  if (sizeBytes < 10000) return 'medium';
  return 'high';
}

function scanDirectory(dir: string, jsFiles: FileInfo[], tsFiles: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__mocks__') {
        scanDirectory(fullPath, jsFiles, tsFiles);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const relativePath = path.relative(APP_DIR, fullPath);

      if (ext === '.js' || ext === '.jsx') {
        const stats = fs.statSync(fullPath);
        jsFiles.push({
          path: relativePath,
          name: entry.name,
          extension: ext,
          category: categorizeFile(relativePath),
          directory: path.dirname(relativePath),
          sizeBytes: stats.size,
          complexity: estimateComplexity(stats.size),
        });
      } else if (ext === '.ts' || ext === '.tsx') {
        tsFiles.push(relativePath);
      }
    }
  }
}

function groupByDirectory(files: FileInfo[]): DirectorySummary[] {
  const dirMap = new Map<string, { jsFiles: string[]; tsCount: number }>();

  for (const file of files) {
    const dir = file.directory || '.';
    if (!dirMap.has(dir)) {
      dirMap.set(dir, { jsFiles: [], tsCount: 0 });
    }
    dirMap.get(dir)!.jsFiles.push(file.name);
  }

  return Array.from(dirMap.entries())
    .map(([directory, data]) => ({
      directory,
      jsFileCount: data.jsFiles.length,
      tsFileCount: 0,
      files: data.jsFiles.sort(),
    }))
    .sort((a, b) => b.jsFileCount - a.jsFileCount);
}

function generateInventory(): MigrationInventory {
  const jsFiles: FileInfo[] = [];
  const tsFiles: string[] = [];

  scanDirectory(APP_DIR, jsFiles, tsFiles);

  const byCategory: Record<string, number> = {};
  const byComplexity: Record<string, number> = { low: 0, medium: 0, high: 0 };

  for (const file of jsFiles) {
    byCategory[file.category] = (byCategory[file.category] || 0) + 1;
    byComplexity[file.complexity]++;
  }

  const totalFiles = jsFiles.length + tsFiles.length;
  const migrationProgress = totalFiles > 0
    ? ((tsFiles.length / totalFiles) * 100).toFixed(1)
    : '0';

  const directories = groupByDirectory(jsFiles);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalJsFiles: jsFiles.length,
      totalTsFiles: tsFiles.length,
      migrationProgress: `${migrationProgress}%`,
      byCategory,
      byComplexity,
    },
    directories,
    files: jsFiles.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function main(): void {
  console.log('Scanning app/ directory for JavaScript files...\n');

  const inventory = generateInventory();

  console.log('=== TypeScript Migration Progress ===\n');
  console.log(`Total TypeScript files: ${inventory.summary.totalTsFiles}`);
  console.log(`Total JavaScript files: ${inventory.summary.totalJsFiles}`);
  console.log(`Migration progress: ${inventory.summary.migrationProgress}`);
  console.log('\n--- Files by Category ---');
  for (const [category, count] of Object.entries(inventory.summary.byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
  console.log('\n--- Files by Complexity ---');
  for (const [complexity, count] of Object.entries(inventory.summary.byComplexity)) {
    console.log(`  ${complexity}: ${count}`);
  }
  console.log('\n--- Top Directories with JS Files ---');
  for (const dir of inventory.directories.slice(0, 10)) {
    console.log(`  ${dir.directory}: ${dir.jsFileCount} files`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));
  console.log(`\nDetailed inventory saved to: ${OUTPUT_FILE}`);
}

main();
