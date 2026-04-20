import { Platform } from 'react-native';
import generateDeviceAnalyticsMetaData from './generateDeviceAnalyticsMetaData';

jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn(() => '123'),
  getVersion: jest.fn(() => '7.0.0'),
  getBrand: jest.fn(() => 'Apple'),
}));

describe('generateDeviceAnalyticsMetaData', () => {
  it('builds a device meta-data object from Platform + DeviceInfo', () => {
    const meta = generateDeviceAnalyticsMetaData();
    expect(meta).toEqual({
      platform: Platform.OS,
      currentBuildNumber: '123',
      applicationVersion: '7.0.0',
      operatingSystemVersion: Platform.Version.toString(),
      deviceBrand: 'Apple',
    });
  });
});
