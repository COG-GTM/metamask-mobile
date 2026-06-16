import {
  filterDiffByFilePath,
  filterDiffLineAdditions,
  hasNumberOfCodeBlocksIncreased,
} from '../common/shared';

const NON_APP_SOURCE_FILE_REGEX = /^(?!app\/.*\.(js|jsx|ts|tsx)$).*/;

const blacklistedDebugStatements = ['console.log(', 'console.debug(', 'debugger'];

function preventDebugStatementsRule(diff: string): boolean {
  const appSourceDiff = filterDiffByFilePath(diff, NON_APP_SOURCE_FILE_REGEX);
  const diffLineAdditions = filterDiffLineAdditions(appSourceDiff);
  const hasBlacklistedDebugStatements = hasNumberOfCodeBlocksIncreased(
    diffLineAdditions,
    blacklistedDebugStatements,
  );

  if (Object.values(hasBlacklistedDebugStatements).includes(true)) {
    return false;
  }

  return true;
}

export { preventDebugStatementsRule };
