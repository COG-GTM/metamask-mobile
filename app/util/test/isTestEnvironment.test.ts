import { isTestEnvironment } from './isTestEnvironment';

describe('isTestEnvironment', () => {
  it.each(['local', 'debug', 'dev', 'test', 'e2e', 'qa'])(
    'is true for the %s environment',
    (environment) => {
      expect(isTestEnvironment(environment)).toBe(true);
    },
  );

  it.each([
    'production',
    'pre-release',
    'prerelease',
    'beta',
    'rc',
    '',
    undefined,
  ])('is false for the %s environment', (environment) => {
    expect(isTestEnvironment(environment)).toBe(false);
  });

  it('is true for E2E builds regardless of environment', () => {
    expect(isTestEnvironment('production', true)).toBe(true);
    expect(isTestEnvironment('pre-release', true)).toBe(true);
  });
});
