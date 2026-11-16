import {
  selectPooledStakingEnabledFlag,
  selectPooledStakingServiceInterruptionBannerEnabledFlag,
  selectStablecoinLendingEnabledFlag,
  selectStablecoinLendingServiceInterruptionBannerEnabledFlag,
} from '.';
import mockedEngine from '../../../../../core/__mocks__/MockedEngine';
import { mockedState } from '../../../../../selectors/featureFlagController/mocks';
import { getVersion } from 'react-native-device-info';
import { isProduction } from '../../../../../util/environment';
import { EarnLaunchDarklyFlag } from './types';
import { FeatureFlags } from '@metamask/remote-feature-flag-controller';

jest.mock('../../../../../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(),
}));

jest.mock('../../../../../util/environment', () => ({
  isProduction: jest.fn(),
}));

const mockGetVersion = getVersion as jest.MockedFunction<typeof getVersion>;
const mockIsProduction = isProduction as jest.MockedFunction<
  typeof isProduction
>;

const CURRENT_VERSION = '7.40.0';

// Fresh state object per call so memoized selectors recompute
const buildState = (remoteFlags: FeatureFlags) => ({
  ...mockedState,
  engine: {
    ...mockedState.engine,
    backgroundState: {
      ...mockedState.engine.backgroundState,
      RemoteFeatureFlagController: {
        ...mockedState.engine.backgroundState.RemoteFeatureFlagController,
        remoteFeatureFlags: { ...remoteFlags },
      },
    },
  },
});

const remoteFlag = (
  enabled: boolean,
  minimumVersion: string,
): EarnLaunchDarklyFlag => ({ enabled, minimumVersion });

const selectorCases = [
  {
    name: 'selectPooledStakingEnabledFlag',
    selector: selectPooledStakingEnabledFlag,
    envVar: 'MM_POOLED_STAKING_ENABLED',
    remoteKey: 'earnPooledStakingEnabled',
  },
  {
    name: 'selectPooledStakingServiceInterruptionBannerEnabledFlag',
    selector: selectPooledStakingServiceInterruptionBannerEnabledFlag,
    envVar: 'MM_POOLED_STAKING_SERVICE_INTERRUPTION_BANNER_ENABLED',
    remoteKey: 'earnPooledStakingServiceInterruptionBannerEnabled',
  },
  {
    name: 'selectStablecoinLendingEnabledFlag',
    selector: selectStablecoinLendingEnabledFlag,
    envVar: 'MM_STABLECOIN_LENDING_UI_ENABLED',
    remoteKey: 'earnStablecoinLendingEnabled',
  },
  {
    name: 'selectStablecoinLendingServiceInterruptionBannerEnabledFlag',
    selector: selectStablecoinLendingServiceInterruptionBannerEnabledFlag,
    envVar: 'MM_STABLE_COIN_SERVICE_INTERRUPTION_BANNER_ENABLED',
    remoteKey: 'earnStablecoinLendingServiceInterruptionBannerEnabled',
  },
];

describe('earnFeatureFlag selectors', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockGetVersion.mockReturnValue(CURRENT_VERSION);
    mockIsProduction.mockReturnValue(false);
    selectorCases.forEach(({ envVar }) => delete process.env[envVar]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe.each(selectorCases)('$name', ({ selector, envVar, remoteKey }) => {
    const run = (remote?: EarnLaunchDarklyFlag) =>
      selector(buildState(remote ? { [remoteKey]: { ...remote } } : {}));

    it('returns true from the default mocked state when the local flag is true', () => {
      process.env[envVar] = 'true';
      expect(
        selector(
          buildState(
            mockedState.engine.backgroundState.RemoteFeatureFlagController
              .remoteFeatureFlags,
          ),
        ),
      ).toBe(true);
    });

    describe('in production', () => {
      beforeEach(() => {
        mockIsProduction.mockReturnValue(true);
      });

      it('returns true when remote flag is enabled and minimumVersion equals current version', () => {
        expect(run(remoteFlag(true, CURRENT_VERSION))).toBe(true);
      });

      it('returns true when remote flag is enabled and minimumVersion is below current version', () => {
        expect(run(remoteFlag(true, '7.0.0'))).toBe(true);
      });

      it('returns false when remote flag is enabled but minimumVersion is above current version', () => {
        process.env[envVar] = 'true';
        expect(run(remoteFlag(true, '7.41.0'))).toBe(false);
      });

      it('returns false when remote flag is enabled but minimumVersion is missing', () => {
        process.env[envVar] = 'true';
        expect(run(remoteFlag(true, ''))).toBe(false);
      });

      it('returns false when remote flag is disabled even if local flag is true', () => {
        process.env[envVar] = 'true';
        expect(run(remoteFlag(false, '0.0.0'))).toBe(false);
      });

      it('returns true when remote flag is enabled even if local flag is false', () => {
        process.env[envVar] = 'false';
        expect(run(remoteFlag(true, '0.0.0'))).toBe(true);
      });

      it('falls back to local flag true when remote flag is missing', () => {
        process.env[envVar] = 'true';
        expect(run()).toBe(true);
      });

      it('falls back to local flag false when remote flag is missing', () => {
        process.env[envVar] = 'false';
        expect(run()).toBe(false);
      });

      it('returns false when remote flag is missing and local flag is unset', () => {
        expect(run()).toBe(false);
      });
    });

    describe('in development', () => {
      it('returns true when local flag is true even if remote flag is disabled', () => {
        process.env[envVar] = 'true';
        expect(run(remoteFlag(false, '0.0.0'))).toBe(true);
      });

      it('returns false when local flag is false even if remote flag is enabled', () => {
        process.env[envVar] = 'false';
        expect(run(remoteFlag(true, '0.0.0'))).toBe(false);
      });

      it('falls back to remote flag when local flag is unset and remote is enabled', () => {
        expect(run(remoteFlag(true, '0.0.0'))).toBe(true);
      });

      it('falls back to remote flag when local flag is unset and remote is disabled', () => {
        expect(run(remoteFlag(false, '0.0.0'))).toBe(false);
      });

      it('applies remote minimumVersion gating when falling back to remote flag', () => {
        expect(run(remoteFlag(true, '99.0.0'))).toBe(false);
      });

      it('returns false when both local and remote flags are unset', () => {
        expect(run()).toBe(false);
      });
    });
  });
});
