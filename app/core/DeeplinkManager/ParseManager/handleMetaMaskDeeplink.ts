import { OriginatorInfo } from '@metamask/sdk-communication-layer';
import { ACTIONS, PREFIXES } from '../../../constants/deeplinks';
import Routes from '../../../constants/navigation/Routes';
import Logger from '../../../util/Logger';
import AppConstants from '../../AppConstants';
import SDKConnect from '../../SDKConnect/SDKConnect';
import handleDeeplink from '../../SDKConnect/handlers/handleDeeplink';
import DevLogger from '../../SDKConnect/utils/DevLogger';
import WC2Manager from '../../WalletConnect/WalletConnectV2';
import DeeplinkManager from '../DeeplinkManager';
import parseOriginatorInfo from '../parseOriginatorInfo';
import extractURLParams from './extractURLParams';

/**
 * Defensive validators for untrusted deeplink parameters.
 *
 * These parse external input (QR codes, `metamask://` links opened by other
 * apps), so every param is treated as hostile until validated. Validation is
 * intentionally permissive enough to keep all real-world deeplinks routing
 * unchanged, while rejecting structurally invalid / injected values so the
 * handler can fail closed instead of throwing.
 */

// MetaMask SDK channel ids are uuid-like tokens. Restrict to a safe charset and
// a sane length to reject control characters and oversized payloads.
const CHANNEL_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;

// RFC 3986 URI scheme grammar: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ).
const SCHEME_REGEX = /^[A-Za-z][A-Za-z0-9+.-]{0,63}$/;

// Public keys are opaque to this handler; bound the length and require
// printable, whitespace-free ASCII to block injection / control characters.
const PUBKEY_REGEX = /^[\x21-\x7e]{1,512}$/;

export function isValidChannelId(channelId: unknown): channelId is string {
  return typeof channelId === 'string' && CHANNEL_ID_REGEX.test(channelId);
}

export function isValidScheme(scheme: unknown): scheme is string {
  return typeof scheme === 'string' && SCHEME_REGEX.test(scheme);
}

export function isValidPubkey(pubkey: unknown): boolean {
  // Optional everywhere it is used; only reject explicitly malformed values.
  if (pubkey === undefined || pubkey === '') {
    return true;
  }
  return typeof pubkey === 'string' && PUBKEY_REGEX.test(pubkey);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function handleMetaMaskDeeplink({
  instance,
  handled,
  wcURL,
  origin,
  params,
  url,
}: {
  instance: DeeplinkManager;
  handled: () => void;
  wcURL: string;
  origin: string;
  params: ReturnType<typeof extractURLParams>['params'];
  url: string;
}) {
  handled();
  // This handler parses untrusted external input. Route inside a try/catch so
  // that any unexpected error fails closed (logged without raw params) instead
  // of throwing out of the handler. No raw secret/key material is logged.
  try {
    return routeMetaMaskDeeplink({ instance, wcURL, origin, params, url });
  } catch (error) {
    DevLogger.log(
      'handleMetaMaskDeeplink:: failed to handle deeplink',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}

function routeMetaMaskDeeplink({
  instance,
  wcURL,
  origin,
  params,
  url,
}: {
  instance: DeeplinkManager;
  wcURL: string;
  origin: string;
  params: ReturnType<typeof extractURLParams>['params'];
  url: string;
}) {
  if (url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.ANDROID_SDK}`)) {
    DevLogger.log(
      `DeeplinkManager:: metamask launched via android sdk deeplink`,
    );
    SDKConnect.getInstance()
      .bindAndroidSDK()
      .catch((err) => {
        Logger.error(err, 'DeepLinkManager failed to connect');
      });
    return;
  }

  if (url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.CONNECT}`)) {
    if (params.redirect && origin === AppConstants.DEEPLINKS.ORIGIN_DEEPLINK) {
      SDKConnect.getInstance().state.navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.RETURN_TO_DAPP_MODAL,
      });
    } else if (params.channelId) {
      // Validate untrusted params before use; fail closed on malformed input.
      if (!isValidChannelId(params.channelId)) {
        DevLogger.log(
          'handleMetaMaskDeeplink:: ignoring connect deeplink - invalid channelId',
        );
        return;
      }
      if (!isValidPubkey(params.pubkey)) {
        DevLogger.log(
          'handleMetaMaskDeeplink:: ignoring connect deeplink - invalid pubkey',
        );
        return;
      }
      // differentiate between  deeplink callback and socket connection
      if (params.comm === 'deeplinking') {
        if (!isValidScheme(params.scheme)) {
          DevLogger.log(
            'handleMetaMaskDeeplink:: ignoring deeplinking connection - invalid scheme',
          );
          return;
        }

        SDKConnect.getInstance().state.deeplinkingService?.handleConnection({
          channelId: params.channelId,
          url,
          scheme: params.scheme ?? '',
          dappPublicKey: params.pubkey,
          originatorInfo: params.originatorInfo,
          request: params.request,
        });
      } else {
        const protocolVersion = parseInt(params.v ?? '1', 10);

        DevLogger.log(
          `handleMetaMaskDeeplink:: deeplink_scheme typeof(protocolVersion)=${typeof protocolVersion} protocolVersion=${protocolVersion} v=${
            params.v
          }`,
        );

        let originatorInfo: OriginatorInfo | undefined;
        if (params.originatorInfo) {
          originatorInfo = parseOriginatorInfo({
            base64OriginatorInfo: params.originatorInfo,
          });
        }
        handleDeeplink({
          channelId: params.channelId,
          origin,
          url,
          protocolVersion,
          context: 'deeplink_scheme',
          originatorInfo,
          rpc: params.rpc,
          otherPublicKey: params.pubkey,
          sdkConnect: SDKConnect.getInstance(),
        }).catch((err) => {
          Logger.error(err, 'DeepLinkManager failed to connect');
        });
      }
    }
    return true;
  } else if (url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.MMSDK}`)) {
    // Validate untrusted params before use; fail closed on malformed input.
    if (!isNonEmptyString(params.message)) {
      DevLogger.log(
        'handleMetaMaskDeeplink:: ignoring mmsdk message - invalid message',
      );
      return;
    }

    if (!isValidScheme(params.scheme)) {
      DevLogger.log(
        'handleMetaMaskDeeplink:: ignoring mmsdk message - invalid scheme',
      );
      return;
    }

    if (params.channelId && !isValidChannelId(params.channelId)) {
      DevLogger.log(
        'handleMetaMaskDeeplink:: ignoring mmsdk message - invalid channelId',
      );
      return;
    }

    if (!isValidPubkey(params.pubkey)) {
      DevLogger.log(
        'handleMetaMaskDeeplink:: ignoring mmsdk message - invalid pubkey',
      );
      return;
    }

    SDKConnect.getInstance().state.deeplinkingService?.handleMessage({
      channelId: params.channelId,
      url,
      message: params.message,
      dappPublicKey: params.pubkey,
      scheme: params.scheme,
      account: params.account ?? '@',
    });
  } else if (
    url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.WC}`) ||
    url.startsWith(`${PREFIXES.METAMASK}/${ACTIONS.WC}`)
  ) {
    // console.debug(`test now deeplink hack ${url}`);
    let fixedUrl = wcURL;
    if (url.startsWith(`${PREFIXES.METAMASK}/${ACTIONS.WC}`)) {
      fixedUrl = url.replace(
        `${PREFIXES.METAMASK}/${ACTIONS.WC}`,
        `${ACTIONS.WC}`,
      );
    } else {
      url.replace(`${PREFIXES.METAMASK}${ACTIONS.WC}`, `${ACTIONS.WC}`);
    }

    WC2Manager.getInstance()
      .then((WC2ManagerInstance) =>
        WC2ManagerInstance.connect({
          wcUri: fixedUrl,
          origin,
          redirectUrl: params?.redirect,
        }),
      )
      .catch((err) => {
        console.warn(`DeepLinkManager failed to connect`, err);
      });
  } else if (
    url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.BUY_CRYPTO}`) ||
    url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.BUY}`)
  ) {
    const rampPath = url
      .replace(`${PREFIXES.METAMASK}${ACTIONS.BUY_CRYPTO}`, '')
      .replace(`${PREFIXES.METAMASK}${ACTIONS.BUY}`, '');
    instance._handleBuyCrypto(rampPath);
  } else if (
    url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.SELL_CRYPTO}`) ||
    url.startsWith(`${PREFIXES.METAMASK}${ACTIONS.SELL}`)
  ) {
    const rampPath = url
      .replace(`${PREFIXES.METAMASK}${ACTIONS.SELL_CRYPTO}`, '')
      .replace(`${PREFIXES.METAMASK}${ACTIONS.SELL}`, '');
    instance._handleSellCrypto(rampPath);
  }
}

export default handleMetaMaskDeeplink;
