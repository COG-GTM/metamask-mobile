import { filterDiffByFilePath, filterDiffLineAdditions } from '../common/shared';

// Matches files in app/ directory with .ts, .tsx, .js, .jsx extensions
const APP_FOLDER_REGEX = /^app\/.*\.(ts|tsx|js|jsx)$/;

// Matches <Text> elements with string literal children that are not using
// strings() or I18n.t() for internationalization.
// Captures patterns like: <Text>Some hardcoded string</Text>
// but allows: <Text>{strings('key')}</Text> or <Text>{I18n.t('key')}</Text>
const TEXT_WITH_LITERAL_REGEX =
  /<Text[^>]*>\s*(?!\s*\{)[A-Za-z][\s\S]*?<\/Text>/;

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
  const appDiff = filterDiffByFilePath(diff, APP_FOLDER_REGEX);
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

    // Skip empty lines and non-JSX lines
    if (!trimmedLine || !trimmedLine.includes('<Text')) {
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
