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

/**
 * Matches a 32-byte (64 hex character) private key, with an optional `0x`
 * prefix. Anchored on both ends so the entire string must be valid hex.
 */
const PRIVATE_KEY_HEX_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;

/**
 * Returns whether the provided value is a syntactically valid hex private key
 * (exactly 64 hex characters, with an optional `0x` prefix → 32 bytes).
 *
 * This only validates the encoding; it never imports, logs, or otherwise
 * consumes the value. Callers use it to decide whether a string that failed
 * URL parsing should be treated as a private key rather than surfaced as an
 * "invalid URL" (which would log/alert the raw secret).
 */
export function isValidPrivateKey(value: string): boolean {
  return typeof value === 'string' && PRIVATE_KEY_HEX_REGEX.test(value);
}

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
  try {
    const validatedUrl = new URL(url);
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
    // A bare private key fails URL parsing. Detect it by validating that the
    // value is actually hex (not just 64 chars long) so we never log or alert
    // the raw secret. Anything that is 64 chars but not valid hex falls through
    // to normal invalid-URL handling.
    const isPrivateKey = isValidPrivateKey(url);
    if (error && !isPrivateKey) {
      Logger.error(
        error as Error,
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
