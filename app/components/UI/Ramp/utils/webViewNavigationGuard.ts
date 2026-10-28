import { Alert } from 'react-native';
import { strings } from '../../../../../locales/i18n';
import { allowLinkOpen, getAlertMessage } from '../../../../util/browser';
import Logger from '../../../../util/Logger';

/**
 * Lets every navigation reach `onShouldStartLoadWithRequest`. With the
 * library default (`http://*`, `https://*`) any other scheme is forwarded
 * to `Linking.openURL` before our handler is consulted.
 */
export const RAMP_WEBVIEW_ORIGIN_WHITELIST = ['*'];

const LOADABLE_PROTOCOLS = ['http:', 'https:', 'about:'];

/**
 * Schemes a provider checkout never needs and that MetaMask (or the OS)
 * would act on: wallet deeplinks, WalletConnect pairing, dapp browser.
 */
const ALWAYS_BLOCKED_PROTOCOLS = [
  'metamask:',
  'dapp:',
  'wc:',
  'ethereum:',
  // eslint-disable-next-line no-script-url
  'javascript:',
  'file:',
  'data:',
  'blob:',
];

/**
 * Returns the lower-cased URL scheme including the trailing colon.
 *
 * @param url - Absolute URL requested by the WebView.
 * @returns The scheme (e.g. `https:`), or `undefined` when there is none.
 */
export const getUrlProtocol = (url: string): string | undefined => {
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(url.trim());
  return match ? match[1].toLowerCase() : undefined;
};

interface RampWebViewNavigationGuardOptions {
  /**
   * When true, schemes outside the blocked list (e.g. a bank app) are only
   * opened after the user confirms. When false every external scheme is
   * dropped silently (for WebViews the user cannot see).
   */
  promptForExternalApps: boolean;
}

/**
 * Builds an `onShouldStartLoadWithRequest` handler for Ramp WebViews. Loads
 * http(s)/about URLs, drops wallet and other dangerous schemes, and either
 * prompts for or drops any other external scheme. Pair it with
 * `RAMP_WEBVIEW_ORIGIN_WHITELIST`.
 *
 * @param options - Guard options.
 * @param options.promptForExternalApps - Whether to ask the user before opening a non-blocked external scheme.
 * @returns Handler returning `true` to load the request, `false` to stop it.
 */
export const createRampWebViewNavigationGuard = ({
  promptForExternalApps,
}: RampWebViewNavigationGuardOptions) => {
  let isPromptVisible = false;
  const resetPrompt = () => {
    isPromptVisible = false;
  };

  return ({ url }: { url: string }): boolean => {
    const protocol = getUrlProtocol(url);
    if (protocol && LOADABLE_PROTOCOLS.includes(protocol)) {
      return true;
    }

    Logger.log(`Ramp WebView blocked navigation with protocol ${protocol}`);

    if (
      !promptForExternalApps ||
      !protocol ||
      ALWAYS_BLOCKED_PROTOCOLS.includes(protocol) ||
      isPromptVisible
    ) {
      return false;
    }

    isPromptVisible = true;
    Alert.alert(
      strings('onboarding.warning_title'),
      getAlertMessage(protocol, strings),
      [
        {
          text: strings('browser.protocol_alert_options.ignore'),
          onPress: resetPrompt,
          style: 'cancel',
        },
        {
          text: strings('browser.protocol_alert_options.allow'),
          onPress: () => {
            resetPrompt();
            allowLinkOpen(url);
          },
          style: 'default',
        },
      ],
      { onDismiss: resetPrompt },
    );
    return false;
  };
};
