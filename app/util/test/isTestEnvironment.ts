/**
 * Environments in which test-only affordances (WebView remote debugging,
 * single-tap credential reveal, crypto test screens, etc.) may be enabled.
 * Release-type environments such as 'production' and 'pre-release' are
 * intentionally excluded.
 */
export const TEST_ENVIRONMENTS: readonly string[] = [
  'local',
  'debug',
  'dev',
  'test',
  'e2e',
  'qa',
];

export const isTestEnvironment = (
  environment: string | undefined,
  e2e = false,
): boolean =>
  e2e || (environment !== undefined && TEST_ENVIRONMENTS.includes(environment));
