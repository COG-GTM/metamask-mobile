import {
  APP_FOLDER_JS_REGEX,
  SOURCE_FOLDERS_JS_REGEX,
} from '../common/constants';
import { filterDiffFileCreations, restrictedFilePresent } from '../common/shared';

/**
 * Prevents addition of new JavaScript files in the app/ folder.
 * This is the original rule that only checks the app/ folder.
 * @param diff - Git diff string
 * @returns true if no new JS/JSX files are added in app/, false otherwise
 */
function preventJavaScriptFileAdditions(diff: string): boolean {
  const diffAdditions = filterDiffFileCreations(diff);
  if (restrictedFilePresent(diffAdditions, APP_FOLDER_JS_REGEX)) {
    return false;
  }
  return true;
}

/**
 * Prevents addition of new JavaScript files in all source folders (app/, e2e/).
 * This is an enhanced rule that covers more folders that should use TypeScript.
 * Excludes: config files (*.config.js), scripts folder, and .github folder.
 * @param diff - Git diff string
 * @returns true if no new JS/JSX files are added in source folders, false otherwise
 */
function preventJavaScriptFileAdditionsStrict(diff: string): boolean {
  const diffAdditions = filterDiffFileCreations(diff);
  if (restrictedFilePresent(diffAdditions, SOURCE_FOLDERS_JS_REGEX)) {
    return false;
  }
  return true;
}

export { preventJavaScriptFileAdditions, preventJavaScriptFileAdditionsStrict };
