import { defaultValues, mockedMinimumAppVersion } from './constants';
import { FEATURE_FLAG_NAME } from './types';

describe('minimumAppVersion constants', () => {
  describe('defaultValues', () => {
    it('has appMinimumBuild', () => {
      expect(defaultValues.appMinimumBuild).toBe(1243);
    });

    it('has appleMinimumOS', () => {
      expect(defaultValues.appleMinimumOS).toBe(6);
    });

    it('has androidMinimumAPIVersion', () => {
      expect(defaultValues.androidMinimumAPIVersion).toBe(21);
    });
  });

  describe('mockedMinimumAppVersion', () => {
    it('has mocked values under feature flag key', () => {
      const mocked = mockedMinimumAppVersion[FEATURE_FLAG_NAME];
      expect(mocked.appMinimumBuild).toBe(1337);
      expect(mocked.androidMinimumAPIVersion).toBe(12);
      expect(mocked.appleMinimumOS).toBe(2);
    });
  });
});
