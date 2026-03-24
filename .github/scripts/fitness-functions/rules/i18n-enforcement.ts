import { filterDiffLineAdditions } from '../common/shared';

// Matches files in app/ directory with .ts, .tsx, .js, .jsx extensions
const APP_FOLDER_REGEX = /^app\/.*\.(ts|tsx|js|jsx)$/;

// Matches <Text> elements with string literal children that are not using
// strings() or I18n.t() for internationalization.
// eslint-disable-next-line no-useless-escape
const TEXT_WITH_LITERAL_REGEX = /<Text[^>]*>\s*[A-Za-z]/;

/**
 * Filters diff to only include blocks for files matching the given regex.
 * Unlike filterDiffByFilePath which excludes matching files, this function
 * includes only files whose paths match the regex.
 */
function filterDiffIncludeByFilePath(diff: string, regex: RegExp): string {
  const diffBlocks = diff.split(`diff --git`).slice(1);

  const filteredDiff = diffBlocks
    .map((block) => block.trim())
    .filter((block) => {
      let shouldIncludeBlock = false;

      block
        .split('\n')[0]
        .trim()
        .split(' ')
        .map((path) => path.substring(2))
        .forEach((path) => {
          if (regex.test(path)) {
            shouldIncludeBlock = true;
          }
        });

      return shouldIncludeBlock;
    })
    .map((block) => `diff --git ${block}`)
    .join('\n');

  return filteredDiff;
}

/**
 * Prevents untranslated strings in new code additions.
 * Flags JSX <Text> elements with string literal children
 * that don't use strings() or I18n.t().
 *
 * @param diff - Code diff between PR and target branch
 * @returns - Boolean indicating if diff is free of untranslated strings
 */
function preventUntranslatedStrings(diff: string): boolean {
  // Filter diff to only include files in the app/ directory
  const appDiff = filterDiffIncludeByFilePath(diff, APP_FOLDER_REGEX);
  if (!appDiff) {
    return true;
  }

  // Get only the added lines from the diff
  const diffAdditions = filterDiffLineAdditions(appDiff);
  if (!diffAdditions) {
    return true;
  }

  // Check each added line for <Text> elements with hardcoded string literals
  const lines = diffAdditions.split(/[\n\/]n/);
  for (const line of lines) {
    const trimmedLine = line.replace(/^\+/, '').trim();

    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Skip lines that use strings() or I18n.t()
    if (trimmedLine.includes('strings(') || trimmedLine.includes('I18n.t(')) {
      continue;
    }

    // Flag lines with <Text> containing string literal children
    if (TEXT_WITH_LITERAL_REGEX.test(trimmedLine)) {
      return false;
    }
  }

  return true;
}

export { preventUntranslatedStrings };
