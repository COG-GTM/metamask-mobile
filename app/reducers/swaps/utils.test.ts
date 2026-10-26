import { FeatureFlags } from '@metamask/swaps-controller/dist/types';
import Device from '../../util/device';
import {
  getChainFeatureFlags,
  getFeatureFlagDeviceKey,
  getSwapsLiveness,
} from './utils';

jest.mock('../../util/device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn(),
}));

const mockIsIos = Device.isIos as jest.Mock;
const mockIsAndroid = Device.isAndroid as jest.Mock;

const featureFlags = {
  ethereum: {
    mobileActive: true,
    mobileActiveIOS: true,
    mobileActiveAndroid: false,
  },
} as unknown as FeatureFlags;

describe('swaps utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChainFeatureFlags', () => {
    it('returns the feature flags for the chain', () => {
      expect(getChainFeatureFlags(featureFlags, '0x1')).toEqual(
        featureFlags.ethereum,
      );
    });

    it('returns undefined for unknown chains', () => {
      expect(getChainFeatureFlags(featureFlags, '0x12345')).toBeUndefined();
    });
  });

  describe('getFeatureFlagDeviceKey', () => {
    it('returns the iOS key on iOS', () => {
      mockIsIos.mockReturnValue(true);
      mockIsAndroid.mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveIOS');
    });

    it('returns the Android key on Android', () => {
      mockIsIos.mockReturnValue(false);
      mockIsAndroid.mockReturnValue(true);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveAndroid');
    });

    it('returns the generic key otherwise', () => {
      mockIsIos.mockReturnValue(false);
      mockIsAndroid.mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActive');
    });
  });

  describe('getSwapsLiveness', () => {
    it('returns the liveness for the current device', () => {
      mockIsIos.mockReturnValue(true);
      mockIsAndroid.mockReturnValue(false);
      expect(getSwapsLiveness(featureFlags, '0x1')).toBe(true);

      mockIsIos.mockReturnValue(false);
      mockIsAndroid.mockReturnValue(true);
      expect(getSwapsLiveness(featureFlags, '0x1')).toBe(false);
    });

    it('returns false when there are no flags for the chain', () => {
      mockIsIos.mockReturnValue(true);
      expect(getSwapsLiveness(featureFlags, '0x12345')).toBe(false);
    });
  });
});
