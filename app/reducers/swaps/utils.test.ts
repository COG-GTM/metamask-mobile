import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';
import Device from '../../util/device';
import {
  getChainFeatureFlags,
  getFeatureFlagDeviceKey,
  getSwapsLiveness,
} from './utils';

const makeFlags = (chainName: string, flagsByDevice: object) =>
  ({
    [chainName]: flagsByDevice,
  } as unknown as FeatureFlags);

describe('reducers/swaps/utils', () => {
  describe('getChainFeatureFlags', () => {
    it('returns the flags for the mapped chain name', () => {
      const flags = makeFlags('ethereum', { mobileActive: true });
      expect(getChainFeatureFlags(flags, '0x1')).toEqual({ mobileActive: true });
    });

    it('returns undefined when the chain is not mapped', () => {
      const flags = makeFlags('ethereum', {});
      expect(
        getChainFeatureFlags(flags, '0xdeadbeef' as `0x${string}`),
      ).toBeUndefined();
    });
  });

  describe('getFeatureFlagDeviceKey', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns mobileActiveIOS on iOS', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(true);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveIOS');
    });

    it('returns mobileActiveAndroid on Android', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(false);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(true);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActiveAndroid');
    });

    it('falls back to mobileActive on other platforms', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(false);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
      expect(getFeatureFlagDeviceKey()).toBe('mobileActive');
    });
  });

  describe('getSwapsLiveness', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns the device-specific liveness flag when available', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(true);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
      const flags = makeFlags('ethereum', { mobileActiveIOS: true });
      expect(getSwapsLiveness(flags, '0x1')).toBe(true);
    });

    it('returns false when the device key is missing from the chain flags', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(false);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(true);
      const flags = makeFlags('ethereum', { mobileActiveIOS: true });
      expect(getSwapsLiveness(flags, '0x1')).toBe(false);
    });

    it('returns false when the chain is not present in the flags', () => {
      jest.spyOn(Device, 'isIos').mockReturnValue(true);
      jest.spyOn(Device, 'isAndroid').mockReturnValue(false);
      const flags = makeFlags('ethereum', {});
      expect(
        getSwapsLiveness(flags, '0xdeadbeef' as `0x${string}`),
      ).toBe(false);
    });
  });
});
