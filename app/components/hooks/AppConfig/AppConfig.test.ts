import type AppConfig from './AppConfig';

describe('AppConfig', () => {
  it('is compatible with a well-formed configuration object', () => {
    const config: AppConfig = {
      security: {
        minimumVersions: {
          appMinimumBuild: 1000,
          appleMinimumOS: 15,
          androidMinimumAPIVersion: 24,
        },
      },
    };
    expect(config.security.minimumVersions.appMinimumBuild).toBe(1000);
    expect(config.security.minimumVersions.appleMinimumOS).toBe(15);
    expect(config.security.minimumVersions.androidMinimumAPIVersion).toBe(24);
  });
});
