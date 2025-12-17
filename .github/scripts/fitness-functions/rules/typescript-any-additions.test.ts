import {
  generateModifyFilesDiff,
  generateCreateFileDiff,
} from '../common/test-data';
import {
  preventAnyTypeAdditions,
  containsExplicitAny,
} from './typescript-any-additions';

describe('containsExplicitAny()', (): void => {
  it('should detect type annotation with any', (): void => {
    expect(containsExplicitAny('const foo: any = 1;')).toBe(true);
    expect(containsExplicitAny('let bar: any;')).toBe(true);
    expect(containsExplicitAny('function test(param: any): void {}')).toBe(true);
  });

  it('should detect type assertion with as any', (): void => {
    expect(containsExplicitAny('const foo = bar as any;')).toBe(true);
    expect(containsExplicitAny('return value as any;')).toBe(true);
  });

  it('should detect generic type parameters with any', (): void => {
    expect(containsExplicitAny('const arr: Array<any> = [];')).toBe(true);
    expect(containsExplicitAny('Promise<any>')).toBe(true);
    expect(containsExplicitAny('Map<string, any>')).toBe(true);
  });

  it('should detect any array type', (): void => {
    expect(containsExplicitAny('const arr: any[] = [];')).toBe(true);
  });

  it('should not detect any in comments', (): void => {
    expect(containsExplicitAny('// This is any comment')).toBe(false);
    expect(containsExplicitAny('* @param any - description')).toBe(false);
  });

  it('should not detect any in eslint-disable comments', (): void => {
    expect(containsExplicitAny('// eslint-disable-next-line @typescript-eslint/no-explicit-any')).toBe(false);
  });

  it('should not detect any in variable names or strings', (): void => {
    expect(containsExplicitAny('const anyValue = 1;')).toBe(false);
    expect(containsExplicitAny('const company = "Company";')).toBe(false);
    expect(containsExplicitAny('const many = 5;')).toBe(false);
  });

  it('should not flag properly typed code', (): void => {
    expect(containsExplicitAny('const foo: string = "bar";')).toBe(false);
    expect(containsExplicitAny('const arr: number[] = [];')).toBe(false);
    expect(containsExplicitAny('function test(param: string): void {}')).toBe(false);
  });
});

describe('preventAnyTypeAdditions()', (): void => {
  it('should pass when receiving an empty diff', (): void => {
    const testDiff = '';

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with properly typed TypeScript', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.ts', 'const foo: string = "bar";'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when receiving a diff with JavaScript files (not checked)', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.js', 'const foo = bar as any;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when receiving a diff with explicit any type annotation', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.ts', 'const foo: any = 1;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with as any assertion', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/utils/helper.tsx', 'const result = value as any;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should not pass when receiving a diff with generic any type', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/services/api.ts', 'const data: Promise<any> = fetch();'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should pass when modifying existing TypeScript files without adding any', (): void => {
    const testDiff = [
      generateModifyFilesDiff('app/components/test.ts', 'const newVar: string = "test";', 'const oldVar = 1;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should not pass when modifying TypeScript files and adding any', (): void => {
    const testDiff = [
      generateModifyFilesDiff('app/components/test.ts', 'const newVar: any = "test";', 'const oldVar = 1;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(false);
  });

  it('should pass when any is in a comment in TypeScript file', (): void => {
    const testDiff = [
      generateCreateFileDiff('app/components/test.ts', '// TODO: Fix any types later'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });

  it('should pass when files are in .github directory (excluded)', (): void => {
    const testDiff = [
      generateCreateFileDiff('.github/scripts/test.ts', 'const foo: any = 1;'),
    ].join('');

    const hasRulePassed = preventAnyTypeAdditions(testDiff);

    expect(hasRulePassed).toBe(true);
  });
});
