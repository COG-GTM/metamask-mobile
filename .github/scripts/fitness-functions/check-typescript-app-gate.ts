import path from 'path';
import { checkTypescriptAppGate } from './rules/typescript-app-gate';

// Resolve the app/ directory relative to the repo root.
// This script is expected to be run from .github/scripts/ via ts-node,
// so we go up three levels (__dirname = .github/scripts/fitness-functions)
// to reach the repo root.
const repoRoot = path.resolve(__dirname, '..', '..', '..');

console.log('Checking TypeScript enforcement gate for app/ directory...');
console.log(`Repo root: ${repoRoot}\n`);

const { passed, violations } = checkTypescriptAppGate(repoRoot);

if (passed) {
  console.log(
    'OK: No new .js or .jsx files found in the app/ directory.',
  );
  process.exit(0);
} else {
  console.error(
    `FAILED: Found ${violations.length} .js/.jsx file(s) in app/ that are not in the allowlist:\n`,
  );
  violations.forEach((file) => {
    console.error(`  - ${file}`);
  });
  console.error(
    '\nAll new files in the app/ directory must use .ts or .tsx extensions.',
  );
  console.error(
    'If you are migrating an existing file, remove it from the allowlist in',
  );
  console.error(
    '  .github/scripts/fitness-functions/rules/typescript-app-gate.ts',
  );
  process.exit(1);
}
