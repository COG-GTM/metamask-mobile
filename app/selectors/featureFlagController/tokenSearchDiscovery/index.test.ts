import { tokenSearchDiscoveryEnabled, FEATURE_FLAG_NAME } from '.';

jest.mock('..', () => ({
  selectRemoteFeatureFlags: (state: any) =>
    state.engine.backgroundState.RemoteFeatureFlagController?.remoteFeatureFlags || {},
}));

describe('tokenSearchDiscovery Selector', () => {
  it('should return true when feature flag is enabled', () => {
    const state = {
      engine: {
        backgroundState: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: { [FEATURE_FLAG_NAME]: true },
          },
        },
      },
    } as any;
    expect(tokenSearchDiscoveryEnabled(state)).toBe(true);
  });

  it('should return false when feature flag is disabled', () => {
    const state = {
      engine: {
        backgroundState: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: { [FEATURE_FLAG_NAME]: false },
          },
        },
      },
    } as any;
    expect(tokenSearchDiscoveryEnabled(state)).toBe(false);
  });

  it('should return default false when feature flag is missing', () => {
    const state = {
      engine: {
        backgroundState: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: {},
          },
        },
      },
    } as any;
    expect(tokenSearchDiscoveryEnabled(state)).toBe(false);
  });
});
