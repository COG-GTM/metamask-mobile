import { Linking } from 'react-native';
import Share from 'react-native-share';

import ReactNativeBlobUtil from 'react-native-blob-util';
import { strings } from '../../../locales/i18n';
import Device from '../device';






const shareFile = async (filePath) => {
  const options = {
    url: filePath,
    saveToFiles: true,
    failOnCancel: false
  };
  return await Share.open(options);
};

const checkAppleWalletPass = async (
response,
downloadUrl) =>
{
  /**
   * Support native UI for downloading Apple Wallet Passes
   */
  const APPLE_WALLET_PASS_MIME_TYPE = 'application/vnd.apple.pkpass';
  if (
  Device.isIos() &&
  response.respInfo &&
  response.respInfo.headers['Content-Type'] === APPLE_WALLET_PASS_MIME_TYPE)
  {
    try {
      await Linking.openURL(downloadUrl);
      return {
        success: true,
        message: 'success'
      };
    } catch (err) {
      if (err instanceof Error) {
        return {
          success: false,
          message: err.message.toString()
        };
      }
      return {
        success: false,
        message: strings('download_files.message')
      };
    }
  }
};

const downloadFile = async (downloadUrl) => {
  const { config } = ReactNativeBlobUtil;
  const response = await config({ fileCache: true }).fetch(
    'GET',
    downloadUrl
  );

  const checkAppleWalletPassResponse = await checkAppleWalletPass(
    response,
    downloadUrl
  );

  if (checkAppleWalletPassResponse) {
    return checkAppleWalletPassResponse;
  }

  const path = response.path();
  if (path) {
    try {
      const shareResponse = await shareFile(path);
      return {
        success: shareResponse.success,
        message: shareResponse.message
      };
    } catch (err) {
      if (err instanceof Error) {
        return {
          success: false,
          message: err.message.toString()
        };
      }
      return {
        success: false,
        message: strings('download_files.message')
      };
    }
  }
  return {
    success: false,
    message: response.text().toString()
  };
};

export default downloadFile;