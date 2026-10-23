import { execSync } from 'child_process';
import { RULES, runFitnessFunctionRule } from './fitness-functions/rules';

// TypeScript app gate: runs the fitness-function rules (no new .js/.jsx files
// under app/, no blacklisted code blocks) against the whole-repo diff between
// HEAD and its merge base with the base branch.
// Usage: yarn run check-ts-app-gate [baseRef]   (default: origin/$BASE_REF or origin/main)
const baseRef =
  process.argv[2] ??
  (process.env.BASE_REF ? `origin/${process.env.BASE_REF}` : 'origin/main');

const repoRoot = execSync('git rev-parse --show-toplevel').toString().trim();
const mergeBase = execSync(`git merge-base "${baseRef}" HEAD`, {
  cwd: repoRoot,
})
  .toString()
  .trim();
const diff = execSync(`git diff --no-renames "${mergeBase}" HEAD`, {
  cwd: repoRoot,
  maxBuffer: 1024 * 1024 * 1024,
}).toString();

console.log(`TypeScript app gate: diff ${mergeBase.slice(0, 12)}..HEAD`);
RULES.forEach((rule) => runFitnessFunctionRule(rule, diff));
