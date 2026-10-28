import { Alert, Linking } from 'react-native';
import URLParse from 'url-parse';
import Share, { ShareOptions } from 'react-native-share';
import { ShareOpenResult } from 'react-native-share/lib/typescript/types';
import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util';
import { strings } from '../../../locales/i18n';
import Device from '../device';

interface DownloadResult {
  success: boolean;
  message: string;
}

const shareFile = async (filePath: string) => {
  const options: ShareOptions = {
    url: filePath,
    saveToFiles: true,
    failOnCancel: false,
  };
  return await Share.open(options);
};

const APPLE_WALLET_PASS_MIME_TYPE = 'application/vnd.apple.pkpass';
const EXTERNAL_OPEN_PROTOCOLS = ['https:', 'http:'];

/**
 * Asks the user before handing a page-supplied URL to the OS,
 * which may leave MetaMask for Safari or another app.
 */
const confirmExternalOpen = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    const { host } = new URLParse(url);
    Alert.alert(
      strings('onboarding.warning_title'),
      strings('download_files.wallet_pass_alert', { host }),
      [
        {
          text: strings('browser.protocol_alert_options.ignore'),
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: strings('browser.protocol_alert_options.allow'),
          onPress: () => resolve(true),
          style: 'default',
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

const checkAppleWalletPass = async (
  response: FetchBlobResponse,
  downloadUrl: string,
) => {
  /**
   * Support native UI for downloading Apple Wallet Passes
   */
  if (
    Device.isIos() &&
    response.respInfo &&
    response.respInfo.headers['Content-Type'] === APPLE_WALLET_PASS_MIME_TYPE
  ) {
    const { protocol } = new URLParse(downloadUrl);
    if (!EXTERNAL_OPEN_PROTOCOLS.includes(protocol)) {
      return {
        success: false,
        message: strings('download_files.unknownError'),
      };
    }
    if (!(await confirmExternalOpen(downloadUrl))) {
      return {
        success: false,
        message: strings('download_files.wallet_pass_declined'),
      };
    }
    try {
      await Linking.openURL(downloadUrl);
      return {
        success: true,
        message: 'success',
      };
    } catch (err) {
      if (err instanceof Error) {
        return {
          success: false,
          message: err.message.toString(),
        };
      }
      return {
        success: false,
        message: strings('download_files.unknownError'),
      };
    }
  }
};

const downloadFile = async (downloadUrl: string): Promise<DownloadResult> => {
  const { config } = ReactNativeBlobUtil;
  const response: FetchBlobResponse = await config({ fileCache: true }).fetch(
    'GET',
    downloadUrl,
  );

  const checkAppleWalletPassResponse = await checkAppleWalletPass(
    response,
    downloadUrl,
  );

  if (checkAppleWalletPassResponse) {
    return checkAppleWalletPassResponse;
  }

  const path = response.path();
  if (path) {
    try {
      const shareResponse: ShareOpenResult = await shareFile(path);
      return {
        success: shareResponse.success,
        message: shareResponse.message,
      };
    } catch (err) {
      if (err instanceof Error) {
        return {
          success: false,
          message: err.message.toString(),
        };
      }
      return {
        success: false,
        message: strings('download_files.unknownError'),
      };
    }
  }
  return {
    success: false,
    message: response.text().toString(),
  };
};

export default downloadFile;
