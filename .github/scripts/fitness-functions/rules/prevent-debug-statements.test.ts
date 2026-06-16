import {
  generateCreateFileDiff,
  generateModifyFilesDiff,
} from '../common/test-data';
import { preventDebugStatementsRule } from './prevent-debug-statements';

describe('preventDebugStatementsRule()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when a debug statement is only removed', (): void => {
    const testDiff = generateModifyFilesDiff(
      'app/components/debug.ts',
      undefined,
      "console.log('removed debug statement')",
    );

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when a debug statement is added outside app source files', (): void => {
    const testDiff = generateModifyFilesDiff(
      'scripts/debug.ts',
      "console.log('helper script')",
      undefined,
    );

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when console.log is added to an app source file', (): void => {
    const testDiff = [
      generateModifyFilesDiff('app/components/Button.tsx', 'const x = 1;', undefined),
      generateModifyFilesDiff(
        'app/components/DebugButton.tsx',
        "console.log('debug');",
        undefined,
      ),
    ].join('');

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when console.debug is added in a new app source file', (): void => {
    const testDiff = generateCreateFileDiff(
      'app/util/debug-helper.ts',
      "console.debug('debug helper');",
    );

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when debugger is added in app source files', (): void => {
    const testDiff = generateModifyFilesDiff(
      'app/core/index.js',
      'debugger;',
      undefined,
    );

    const hasRulePassed = preventDebugStatementsRule(testDiff);

    expect(hasRulePassed).toBe(false);
  });
});
