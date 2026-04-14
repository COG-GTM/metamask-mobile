import generateDeviceAnalyticsMetaData from './generateDeviceAnalyticsMetaData';

describe('generateDeviceAnalyticsMetaData', () => {
  it('should return an object with device meta data', () => {
    const result = generateDeviceAnalyticsMetaData();
    expect(result).toHaveProperty('platform');
    expect(result).toHaveProperty('currentBuildNumber');
    expect(result).toHaveProperty('applicationVersion');
    expect(result).toHaveProperty('operatingSystemVersion');
    expect(result).toHaveProperty('deviceBrand');
  });
});
