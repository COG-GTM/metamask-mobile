export const flushPromises = () => new Promise(setImmediate);

export const FIXTURE_SERVER_PORT = 12345;

// E2E test configuration required in app
export const testConfig = {};

// SEGMENT TRACK URL for E2E tests - this is not a real URL and is used for testing purposes only
export const E2E_METAMETRICS_TRACK_URL = 'https://metametrics.test/track';

/**
 * Environments in which test-only affordances (WebView remote debugging,
 * single-tap credential reveal, crypto test screens, etc.) may be enabled.
 * Release-type environments such as 'production' and 'pre-release' are
 * intentionally excluded.
 */
export const TEST_ENVIRONMENTS = ['local', 'debug', 'dev', 'test', 'e2e', 'qa'];

export const isTestEnvironment = (environment, e2e = false) =>
  e2e === true || TEST_ENVIRONMENTS.includes(environment);

export const isE2E = process.env.IS_TEST === 'true';
export const isTest = isTestEnvironment(
  process.env.METAMASK_ENVIRONMENT,
  isE2E,
);
export const enableApiCallLogs = process.env.LOG_API_CALLS === 'true';
export const getFixturesServerPortInApp = () =>
  testConfig.fixtureServerPort ?? FIXTURE_SERVER_PORT;
