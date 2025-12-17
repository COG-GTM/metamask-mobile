import {
  generateModifyFilesDiff,
  generateCreateFileDiff,
} from '../common/test-data';
import {
  preventJavaScriptFileAdditions,
  preventJavaScriptFileAdditionsStrict,
} from './javascript-additions';

describe('preventJavaScriptFileAdditions()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a new TS file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.ts', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with a new JS file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.js', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JSX file on the shared folder', (): void => {
    const testDiff = [
      generateModifyFilesDiff('new-file.ts', 'foo', 'bar'),
      generateModifyFilesDiff('old-file.js', undefined, 'pong'),
      generateCreateFileDiff('app/test.jsx', 'yada yada yada yada'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should pass when receiving a diff with a new JS file in e2e folder (original rule only checks app/)', (): void => {
    const testDiff = [
      generateCreateFileDiff('e2e/specs/test.js', 'test code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });
});

describe('preventJavaScriptFileAdditionsStrict()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a new TS file in app folder', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.ts', 'typescript code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a new TSX file in e2e folder', (): void => {
    const testDiff = [
      generateCreateFileDiff('e2e/specs/test.tsx', 'typescript code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with a new JS file in app folder', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.js', 'javascript code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JS file in e2e folder', (): void => {
    const testDiff = [
      generateCreateFileDiff('e2e/specs/test.js', 'javascript code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with a new JSX file in e2e folder', (): void => {
    const testDiff = [
      generateCreateFileDiff('e2e/components/Button.jsx', 'jsx code'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should pass when receiving a diff with a new JS file in scripts folder (excluded)', (): void => {
    const testDiff = [
      generateCreateFileDiff('scripts/build.js', 'build script'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with a config JS file at root (excluded)', (): void => {
    const testDiff = [
      generateCreateFileDiff('jest.config.js', 'jest config'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when modifying existing JS files (only checks new file creations)', (): void => {
    const testDiff = [
      generateModifyFilesDiff('app/existing.js', 'new code', 'old code'),
      generateModifyFilesDiff('e2e/existing.js', 'new test', 'old test'),
    ].join('');

    const hasRulePassed = preventJavaScriptFileAdditionsStrict(testDiff);

    expect(hasRulePassed).toBe(true);
  });
});
