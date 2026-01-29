import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TypeScriptAdoptionStats {
  tsFiles: number;
  jsFiles: number;
  totalFiles: number;
  adoptionPercentage: number;
}

function findRepoRoot(): string {
  let currentDir = __dirname;
  for (let i = 0; i < 10; i++) {
    const appDir = path.join(currentDir, 'app');
    const packageJson = path.join(currentDir, 'package.json');
    if (fs.existsSync(appDir) && fs.existsSync(packageJson)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  currentDir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const appDir = path.join(currentDir, 'app');
    const packageJson = path.join(currentDir, 'package.json');
    if (fs.existsSync(appDir) && fs.existsSync(packageJson)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find repository root');
}

function getTypeScriptAdoptionStats(): TypeScriptAdoptionStats {
  const repoRoot = findRepoRoot();
  const appDir = path.join(repoRoot, 'app');

  return getStatsForDir(appDir);
}

function getStatsForDir(appDir: string): TypeScriptAdoptionStats {

  const tsFiles = parseInt(
    execSync(
      `find "${appDir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) | wc -l`,
    )
      .toString()
      .trim(),
    10,
  );

  const jsFiles = parseInt(
    execSync(
      `find "${appDir}" -type f \\( -name "*.js" -o -name "*.jsx" \\) | wc -l`,
    )
      .toString()
      .trim(),
    10,
  );

  const totalFiles = tsFiles + jsFiles;
  const adoptionPercentage =
    totalFiles > 0 ? (tsFiles / totalFiles) * 100 : 100;

  return {
    tsFiles,
    jsFiles,
    totalFiles,
    adoptionPercentage,
  };
}

function reportTypeScriptAdoption(): void {
  const stats = getTypeScriptAdoptionStats();

  console.log('\n=== TypeScript Adoption Report ===');
  console.log(`TypeScript files (*.ts, *.tsx): ${stats.tsFiles}`);
  console.log(`JavaScript files (*.js, *.jsx): ${stats.jsFiles}`);
  console.log(`Total source files: ${stats.totalFiles}`);
  console.log(
    `TypeScript adoption: ${stats.adoptionPercentage.toFixed(2)}%`,
  );
  console.log('==================================\n');
}

export { getTypeScriptAdoptionStats, reportTypeScriptAdoption };
export type { TypeScriptAdoptionStats };
