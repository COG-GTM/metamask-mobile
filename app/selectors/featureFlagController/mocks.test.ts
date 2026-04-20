import {
  getInvalidMockedFeatureFlag,
  mockedEmptyFlagsState,
  mockedState,
  mockedUndefinedFlagsState,
} from './mocks';

describe('featureFlagController/mocks', () => {
  it('mockedState populates RemoteFeatureFlagController with feature flag values', () => {
    const flags =
      mockedState.engine.backgroundState.RemoteFeatureFlagController
        .remoteFeatureFlags;
    expect(flags).toEqual(
      expect.objectContaining({ productSafetyDappScanning: true }),
    );
    expect(
      mockedState.engine.backgroundState.RemoteFeatureFlagController
        .cacheTimestamp,
    ).toBe(0);
  });

  it('mockedEmptyFlagsState exposes no feature flags', () => {
    expect(
      mockedEmptyFlagsState.engine.backgroundState.RemoteFeatureFlagController
        .remoteFeatureFlags,
    ).toEqual({});
  });

  it('mockedUndefinedFlagsState sets the whole controller to undefined', () => {
    expect(
      mockedUndefinedFlagsState.engine.backgroundState
        .RemoteFeatureFlagController,
    ).toBeUndefined();
  });

  it('getInvalidMockedFeatureFlag wraps the provided flags into a state tree', () => {
    // Cast narrowed to keep test isolated from @metamask/remote-feature-flag-controller internals.
    const result = getInvalidMockedFeatureFlag({
      someBrokenFlag: 'not-a-boolean',
    } as unknown as Parameters<typeof getInvalidMockedFeatureFlag>[0]);
    expect(
      result.engine.backgroundState.RemoteFeatureFlagController
        .remoteFeatureFlags,
    ).toEqual({ someBrokenFlag: 'not-a-boolean' });
  });
});
