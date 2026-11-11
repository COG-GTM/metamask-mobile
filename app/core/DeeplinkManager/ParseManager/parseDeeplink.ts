import { PROTOCOLS } from '../../../constants/deeplinks';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';
import Logger from '../../../util/Logger';
import DevLogger from '../../SDKConnect/utils/DevLogger';
import DeeplinkManager from '../DeeplinkManager';
import extractURLParams from './extractURLParams';
import handleDappUrl from './handleDappUrl';
import handleMetaMaskDeeplink from './handleMetaMaskDeeplink';
import handleUniversalLink from './handleUniversalLink';
import connectWithWC from './connectWithWC';
import { Alert } from 'react-native';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';

const isPrivateKeyCandidate = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.length === 64 ||
    (trimmed.length === 66 && trimmed.substring(0, 2).toLowerCase() === '0x')
  );
};

function parseDeeplink({
  deeplinkManager: instance,
  url,
  origin,
  browserCallBack,
  onHandled,
}: {
  deeplinkManager: DeeplinkManager;
  url: string;
  origin: string;
  browserCallBack?: (url: string) => void;
  onHandled?: () => void;
}) {
  let isValidUrl = false;
  try {
    const validatedUrl = new URL(url);
    isValidUrl = true;
    DevLogger.log('DeepLinkManager:parse validatedUrl', validatedUrl);

    const { urlObj, params } = extractURLParams(url);

    const sdkConnect = SDKConnect.getInstance();

    const protocol = urlObj.protocol.replace(':', '');
    DevLogger.log(
      `DeepLinkManager:parse sdkInit=${sdkConnect.hasInitialized()} origin=${origin} protocol=${protocol}`,
      url,
    );

    const handled = () => (onHandled ? onHandled() : false);

    const wcURL = params?.uri || urlObj.href;

    switch (urlObj.protocol.replace(':', '')) {
      case PROTOCOLS.HTTP:
      case PROTOCOLS.HTTPS:
        handleUniversalLink({
          instance,
          handled,
          urlObj,
          params,
          browserCallBack,
          origin,
          wcURL,
          url,
        });

        break;
      case PROTOCOLS.WC:
        connectWithWC({ handled, wcURL, origin, params });
        break;

      case PROTOCOLS.ETHEREUM:
        handled();
        instance._handleEthereumUrl(url, origin).catch((err) => {
          Logger.error(err, 'Error handling ethereum url');
        });
        break;

      // Specific to the browser screen
      // For ex. navigate to a specific dapp
      case PROTOCOLS.DAPP:
        handleDappUrl({ instance, handled, urlObj, browserCallBack });
        break;

      // Specific to the MetaMask app
      // For ex. go to settings
      case PROTOCOLS.METAMASK:
        handleMetaMaskDeeplink({
          instance,
          handled,
          wcURL,
          origin,
          params,
          url,
        });
        break;
      default:
        return false;
    }

    return true;
  } catch (error) {
    const isPrivateKey = isPrivateKeyCandidate(url);
    if (error && !isPrivateKey) {
      // URL parse errors echo the raw input, which may be a scanned secret.
      Logger.error(
        isValidUrl ? (error as Error) : new Error('Invalid deeplink URL'),
        'DeepLinkManager:parse error parsing deeplink',
      );
      if (origin === AppConstants.DEEPLINKS.ORIGIN_QR_CODE) {
        Alert.alert(
          strings('qr_scanner.unrecognized_address_qr_code_title'),
          strings('qr_scanner.unrecognized_address_qr_code_desc'),
        );
      } else {
        Alert.alert(strings('deeplink.invalid'), `Invalid URL: ${url}`);
      }
    }

    return false;
  }
}

export default parseDeeplink;
