import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationProgress {
  jsFileCount: number;
  tsFileCount: number;
  totalSourceFiles: number;
  migrationPercentage: number;
  anyTypeCount: number;
  filesWithAny: string[];
}

interface ProgressReport {
  timestamp: string;
  appFolder: MigrationProgress;
  e2eFolder: MigrationProgress;
  overall: MigrationProgress;
}

/**
 * Counts files with a specific extension in a directory
 * @param directory - Directory to search
 * @param extensions - File extensions to count (e.g., ['.js', '.jsx'])
 * @returns Number of files found
 */
function countFilesByExtension(
  directory: string,
  extensions: string[],
): number {
  try {
    const extPattern = extensions.map((e) => `*${e}`).join(' -o -name ');
    const command = `find ${directory} -type f \\( -name ${extPattern} \\) 2>/dev/null | wc -l`;
    const result = execSync(command, { encoding: 'utf-8' }).trim();
    return parseInt(result, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Counts occurrences of explicit 'any' type in TypeScript files
 * @param directory - Directory to search
 * @returns Object with count and list of files containing 'any'
 */
function countAnyTypeUsage(
  directory: string,
): { count: number; files: string[] } {
  try {
    // Use grep to find explicit any type patterns in TypeScript files
    // Patterns: `: any`, `as any`, `<any>`, `<any,`, `, any>`
    const command = `grep -r -l --include="*.ts" --include="*.tsx" -E "(:\\s*any\\b|\\bas\\s+any\\b|<any[,>]|,\\s*any[,>])" ${directory} 2>/dev/null || true`;
    const result = execSync(command, { encoding: 'utf-8' }).trim();
    const files = result ? result.split('\n').filter(Boolean) : [];

    // Count total occurrences
    let totalCount = 0;
    for (const file of files) {
      try {
        const countCommand = `grep -c -E "(:\\s*any\\b|\\bas\\s+any\\b|<any[,>]|,\\s*any[,>])" "${file}" 2>/dev/null || echo 0`;
        const count = parseInt(
          execSync(countCommand, { encoding: 'utf-8' }).trim(),
          10,
        );
        totalCount += count;
      } catch {
        // Ignore errors for individual files
      }
    }

    return { count: totalCount, files };
  } catch {
    return { count: 0, files: [] };
  }
}

/**
 * Calculates migration progress for a specific directory
 * @param directory - Directory to analyze
 * @returns MigrationProgress object
 */
function calculateDirectoryProgress(directory: string): MigrationProgress {
  const jsCount = countFilesByExtension(directory, ['.js', '.jsx']);
  const tsCount = countFilesByExtension(directory, ['.ts', '.tsx']);
  const total = jsCount + tsCount;
  const percentage = total > 0 ? (tsCount / total) * 100 : 100;
  const anyUsage = countAnyTypeUsage(directory);

  return {
    jsFileCount: jsCount,
    tsFileCount: tsCount,
    totalSourceFiles: total,
    migrationPercentage: Math.round(percentage * 100) / 100,
    anyTypeCount: anyUsage.count,
    filesWithAny: anyUsage.files,
  };
}

/**
 * Generates a full migration progress report
 * @param rootDir - Root directory of the project
 * @returns ProgressReport object
 */
function generateProgressReport(rootDir: string): ProgressReport {
  const appDir = path.join(rootDir, 'app');
  const e2eDir = path.join(rootDir, 'e2e');

  const appProgress = calculateDirectoryProgress(appDir);
  const e2eProgress = calculateDirectoryProgress(e2eDir);

  // Calculate overall progress
  const overallJsCount = appProgress.jsFileCount + e2eProgress.jsFileCount;
  const overallTsCount = appProgress.tsFileCount + e2eProgress.tsFileCount;
  const overallTotal = overallJsCount + overallTsCount;
  const overallPercentage =
    overallTotal > 0 ? (overallTsCount / overallTotal) * 100 : 100;

  return {
    timestamp: new Date().toISOString(),
    appFolder: appProgress,
    e2eFolder: e2eProgress,
    overall: {
      jsFileCount: overallJsCount,
      tsFileCount: overallTsCount,
      totalSourceFiles: overallTotal,
      migrationPercentage: Math.round(overallPercentage * 100) / 100,
      anyTypeCount: appProgress.anyTypeCount + e2eProgress.anyTypeCount,
      filesWithAny: [...appProgress.filesWithAny, ...e2eProgress.filesWithAny],
    },
  };
}

/**
 * Prints a formatted progress report to console
 * @param report - ProgressReport object
 */
function printProgressReport(report: ProgressReport): void {
  console.log('\n========================================');
  console.log('TypeScript Migration Progress Report');
  console.log(`Generated: ${report.timestamp}`);
  console.log('========================================\n');

  console.log('--- App Folder ---');
  console.log(`  JavaScript files: ${report.appFolder.jsFileCount}`);
  console.log(`  TypeScript files: ${report.appFolder.tsFileCount}`);
  console.log(`  Migration progress: ${report.appFolder.migrationPercentage}%`);
  console.log(`  Explicit 'any' count: ${report.appFolder.anyTypeCount}`);

  console.log('\n--- E2E Folder ---');
  console.log(`  JavaScript files: ${report.e2eFolder.jsFileCount}`);
  console.log(`  TypeScript files: ${report.e2eFolder.tsFileCount}`);
  console.log(`  Migration progress: ${report.e2eFolder.migrationPercentage}%`);
  console.log(`  Explicit 'any' count: ${report.e2eFolder.anyTypeCount}`);

  console.log('\n--- Overall ---');
  console.log(`  JavaScript files: ${report.overall.jsFileCount}`);
  console.log(`  TypeScript files: ${report.overall.tsFileCount}`);
  console.log(`  Total source files: ${report.overall.totalSourceFiles}`);
  console.log(`  Migration progress: ${report.overall.migrationPercentage}%`);
  console.log(`  Total explicit 'any' count: ${report.overall.anyTypeCount}`);
  console.log(`  Files with 'any': ${report.overall.filesWithAny.length}`);

  console.log('\n========================================\n');
}

/**
 * Saves progress report to a JSON file
 * @param report - ProgressReport object
 * @param outputPath - Path to save the JSON file
 */
function saveProgressReport(report: ProgressReport, outputPath: string): void {
  const jsonReport = JSON.stringify(report, null, 2);
  fs.writeFileSync(outputPath, jsonReport, 'utf-8');
  console.log(`Progress report saved to: ${outputPath}`);
}

/**
 * Main function to run migration progress tracking
 * Can be run as a standalone script or imported as a module
 */
function trackMigrationProgress(
  rootDir?: string,
  outputPath?: string,
): ProgressReport {
  const projectRoot = rootDir || process.cwd();
  const report = generateProgressReport(projectRoot);

  printProgressReport(report);

  if (outputPath) {
    saveProgressReport(report, outputPath);
  }

  return report;
}

// Run as standalone script if executed directly
if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();
  const outputPath = process.argv[3];
  trackMigrationProgress(rootDir, outputPath);
}

export {
  trackMigrationProgress,
  generateProgressReport,
  calculateDirectoryProgress,
  countFilesByExtension,
  countAnyTypeUsage,
  MigrationProgress,
  ProgressReport,
};
