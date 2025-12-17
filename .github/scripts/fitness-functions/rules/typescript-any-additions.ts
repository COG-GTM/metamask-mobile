import { EXCLUDE_REGEX } from '../common/constants';
import {
  filterDiffByFilePath,
  filterDiffLineAdditions,
} from '../common/shared';

// Regex patterns to detect explicit 'any' type usage in TypeScript
// These patterns match common ways 'any' is used in TypeScript code
const ANY_TYPE_PATTERNS = [
  // Type annotations: `: any`, `: any[]`, `: any | string`
  /:\s*any\b/,
  // Type assertions: `as any`, `as any[]`
  /\bas\s+any\b/,
  // Generic type parameters: `<any>`, `<any,`, `Promise<any>`
  /<any[,>]/,
  // Generic with any as second+ parameter: `Map<string, any>`
  /,\s*any[,>]/,
  // Array type: `any[]`
  /\bany\[\]/,
  // Function return type or parameter: `=> any`, `): any`
  /[)=]\s*:\s*any\b/,
];

// Combined regex for efficiency
const EXPLICIT_ANY_REGEX = new RegExp(
  ANY_TYPE_PATTERNS.map((p) => p.source).join('|'),
);

// Regex to match TypeScript file paths in diff
const TYPESCRIPT_FILE_REGEX = /\.(ts|tsx)$/;

/**
 * Filters diff to only include TypeScript files
 * @param diff - Git diff string
 * @returns Filtered diff containing only TypeScript file changes
 */
function filterTypeScriptFiles(diff: string): string {
  const diffBlocks = diff.split('diff --git').slice(1);

  const filteredBlocks = diffBlocks.filter((block) => {
    const firstLine = block.split('\n')[0].trim();
    const paths = firstLine.split(' ').map((p) => p.substring(2));
    return paths.some((path) => TYPESCRIPT_FILE_REGEX.test(path));
  });

  return filteredBlocks.map((block) => `diff --git${block}`).join('\n');
}

/**
 * Checks if a line contains explicit 'any' type usage
 * @param line - A single line of code
 * @returns true if the line contains explicit 'any' usage
 */
function containsExplicitAny(line: string): boolean {
  // Skip comments
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
    return false;
  }

  // Skip eslint-disable comments that mention 'any'
  if (trimmedLine.includes('eslint-disable') && trimmedLine.includes('any')) {
    return false;
  }

  return EXPLICIT_ANY_REGEX.test(line);
}

/**
 * Prevents addition of new explicit 'any' types in TypeScript files.
 * This rule checks for new lines added to TypeScript files that contain
 * explicit 'any' type annotations, assertions, or generic parameters.
 *
 * @param diff - Git diff string
 * @returns true if no new explicit 'any' types are added, false otherwise
 */
function preventAnyTypeAdditions(diff: string): boolean {
  // Filter out excluded paths (like .github)
  const filteredDiff = filterDiffByFilePath(diff, EXCLUDE_REGEX);

  // Filter to only TypeScript files
  const typeScriptDiff = filterTypeScriptFiles(filteredDiff);

  if (!typeScriptDiff) {
    return true;
  }

  // Get only the added lines
  const addedLines = filterDiffLineAdditions(typeScriptDiff);

  // Check each added line for explicit 'any' usage
  const lines = addedLines.split(/[/\n]/);
  for (const line of lines) {
    if (containsExplicitAny(line)) {
      console.log(`Found explicit 'any' type in added line: ${line.trim()}`);
      return false;
    }
  }

  return true;
}

export { preventAnyTypeAdditions, containsExplicitAny, EXPLICIT_ANY_REGEX };
