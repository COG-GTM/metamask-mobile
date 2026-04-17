import { getFeatureFlagDeviceKey, getChainFeatureFlags, getSwapsLiveness } from './utils';

jest.mock('../../util/device', () => ({
  __esModule: true,
  default: {
    isIos: jest.fn(),
    isAndroid: jest.fn(),
  },
}));

import Device from '../../util/device';

describe('swaps utils', () => {
  describe('getFeatureFlagDeviceKey', () => {
    it('returns mobileActiveIOS for iOS', () => {
      (Device.isIos as jest.Mock).mockReturnValue(true);
      (Device.isAndroid as jest.Mock).mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveIOS');
    });

    it('returns mobileActiveAndroid for Android', () => {
      (Device.isIos as jest.Mock).mockReturnValue(false);
      (Device.isAndroid as jest.Mock).mockReturnValue(true);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveAndroid');
    });

    it('returns mobileActive for other platforms', () => {
      (Device.isIos as jest.Mock).mockReturnValue(false);
      (Device.isAndroid as jest.Mock).mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActive');
    });
  });

  describe('getChainFeatureFlags', () => {
    it('returns feature flags for known chain', () => {
      const featureFlags = {
        ethereum: { mobileActive: true },
      } as any;
      const result = getChainFeatureFlags(featureFlags, '0x1');
      expect(result).toEqual({ mobileActive: true });
    });

    it('returns undefined for unknown chain', () => {
      const featureFlags = {} as any;
      const result = getChainFeatureFlags(featureFlags, '0x999' as any);
      expect(result).toBeUndefined();
    });
  });

  describe('getSwapsLiveness', () => {
    beforeEach(() => {
      (Device.isIos as jest.Mock).mockReturnValue(false);
      (Device.isAndroid as jest.Mock).mockReturnValue(false);
    });

    it('returns false when chain not in feature flags', () => {
      const featureFlags = {} as any;
      const result = getSwapsLiveness(featureFlags, '0x999' as any);
      expect(result).toBe(false);
    });

    it('returns feature flag value when available', () => {
      const featureFlags = {
        ethereum: { mobileActive: true },
      } as any;
      const result = getSwapsLiveness(featureFlags, '0x1');
      expect(result).toBe(true);
    });
  });
});
