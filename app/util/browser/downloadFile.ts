import { Alert, Linking } from 'react-native';
import URLParse from 'url-parse';
import Share, { ShareOptions } from 'react-native-share';
import { ShareOpenResult } from 'react-native-share/lib/typescript/types';
import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util';
import { strings } from '../../../locales/i18n';
import Device from '../device';

export interface DownloadResult {
  success: boolean;
  message: string;
  /** True when the user declined or dismissed the download, so no error should be shown. */
  cancelled?: boolean;
}

export const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_DOWNLOAD_MB = MAX_DOWNLOAD_BYTES / (1024 * 1024);
const PROGRESS_INTERVAL_MS = 100;
const DOWNLOAD_PROTOCOLS = ['https:', 'http:'];
const DOWNLOAD_DIR_NAME = 'browser-downloads';

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

const askUser = (title: string, message: string, allowText: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: strings('browser.protocol_alert_options.ignore'),
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: allowText,
          onPress: () => resolve(true),
          style: 'default',
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

/**
 * Asks the user before handing a page-supplied URL to the OS,
 * which may leave MetaMask for Safari or another app.
 */
const confirmExternalOpen = (url: string): Promise<boolean> => {
  const { host } = new URLParse(url);
  return askUser(
    strings('onboarding.warning_title'),
    strings('download_files.wallet_pass_alert', { host }),
    strings('browser.protocol_alert_options.allow'),
  );
};

/**
 * Asks the user before any bytes of a page-triggered download are fetched.
 */
const confirmDownload = (host: string): Promise<boolean> =>
  askUser(
    strings('download_files.confirm_title'),
    strings('download_files.confirm_message', {
      host,
      maxSize: MAX_DOWNLOAD_MB,
    }),
    strings('download_files.confirm_download'),
  );

const removeFile = async (path: string) => {
  try {
    await ReactNativeBlobUtil.fs.unlink(path);
  } catch {
    // The file may not exist if the request failed before writing it.
  }
};

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
        cancelled: true,
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

const tooLarge = (): DownloadResult => ({
  success: false,
  message: strings('download_files.too_large', { maxSize: MAX_DOWNLOAD_MB }),
});

const fetchToCache = async (
  downloadUrl: string,
  path: string,
): Promise<{ response?: FetchBlobResponse; exceeded: boolean }> => {
  let exceeded = false;
  const task = ReactNativeBlobUtil.config({ path }).fetch('GET', downloadUrl);
  task.progress({ interval: PROGRESS_INTERVAL_MS }, (received, total) => {
    if (
      !exceeded &&
      (Number(received) > MAX_DOWNLOAD_BYTES ||
        Number(total) > MAX_DOWNLOAD_BYTES)
    ) {
      exceeded = true;
      task.cancel();
    }
  });
  try {
    const response = await task;
    return { response, exceeded };
  } catch (err) {
    if (exceeded) {
      return { exceeded };
    }
    throw err;
  }
};

const downloadFile = async (downloadUrl: string): Promise<DownloadResult> => {
  const { protocol, host } = new URLParse(downloadUrl);
  if (!DOWNLOAD_PROTOCOLS.includes(protocol) || !host) {
    return {
      success: false,
      message: strings('download_files.unknownError'),
    };
  }

  if (!(await confirmDownload(host))) {
    return {
      success: false,
      message: strings('download_files.declined'),
      cancelled: true,
    };
  }

  const { CacheDir } = ReactNativeBlobUtil.fs.dirs;
  const cachePath = `${CacheDir}/${DOWNLOAD_DIR_NAME}/MetaMaskDownload_${Date.now()}`;

  try {
    const { response, exceeded } = await fetchToCache(downloadUrl, cachePath);
    if (exceeded || !response) {
      return tooLarge();
    }

    const { size } = await ReactNativeBlobUtil.fs.stat(cachePath);
    if (Number(size) > MAX_DOWNLOAD_BYTES) {
      return tooLarge();
    }

    const checkAppleWalletPassResponse = await checkAppleWalletPass(
      response,
      downloadUrl,
    );
    if (checkAppleWalletPassResponse) {
      return checkAppleWalletPassResponse;
    }

    const shareResponse: ShareOpenResult = await shareFile(cachePath);
    return {
      success: shareResponse.success,
      message: shareResponse.message,
      cancelled: Boolean(shareResponse.dismissedAction),
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
  } finally {
    await removeFile(cachePath);
  }
};

export default downloadFile;
