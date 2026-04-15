import { Platform } from 'react-native';
import { getBuildNumber, getVersion, getBrand } from 'react-native-device-info';


const generateDeviceAnalyticsMetaData = () => ({
  platform: Platform.OS,
  currentBuildNumber: getBuildNumber(),
  applicationVersion: getVersion(),
  operatingSystemVersion: Platform.Version.toString(),
  deviceBrand: getBrand()
});

export default generateDeviceAnalyticsMetaData;