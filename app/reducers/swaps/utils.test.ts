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

const mockDevice = Device as jest.Mocked<typeof Device>;

const featureFlags = {
  ethereum: {
    mobileActive: true,
    mobileActiveIOS: false,
    mobileActiveAndroid: true,
  },
} as unknown as FeatureFlags;

describe('swaps utils', () => {
  beforeEach(() => {
    mockDevice.isIos.mockReturnValue(false);
    mockDevice.isAndroid.mockReturnValue(false);
  });

  describe('getChainFeatureFlags', () => {
    it('returns the flags for a known chain', () => {
      expect(getChainFeatureFlags(featureFlags, '0x1')).toEqual(
        featureFlags.ethereum,
      );
    });

    it('returns undefined for an unknown chain', () => {
      expect(getChainFeatureFlags(featureFlags, '0xdead')).toBeUndefined();
    });
  });

  describe('getFeatureFlagDeviceKey', () => {
    it('returns the iOS key on iOS', () => {
      mockDevice.isIos.mockReturnValue(true);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveIOS');
    });

    it('returns the Android key on Android', () => {
      mockDevice.isAndroid.mockReturnValue(true);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveAndroid');
    });

    it('returns the generic key on other platforms', () => {
      expect(getFeatureFlagDeviceKey()).toBe('mobileActive');
    });
  });

  describe('getSwapsLiveness', () => {
    it('returns the device specific liveness flag', () => {
      mockDevice.isIos.mockReturnValue(true);
      expect(getSwapsLiveness(featureFlags, '0x1')).toBe(false);

      mockDevice.isIos.mockReturnValue(false);
      mockDevice.isAndroid.mockReturnValue(true);
      expect(getSwapsLiveness(featureFlags, '0x1')).toBe(true);
    });

    it('returns false when the chain has no flags', () => {
      expect(getSwapsLiveness(featureFlags, '0xdead')).toBe(false);
    });
  });
});
