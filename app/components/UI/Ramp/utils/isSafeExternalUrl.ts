import Url from 'url-parse';
import { protocolAllowList } from '../../../../util/browser';

const EXTERNAL_LINK_PROTOCOLS = protocolAllowList.filter(
  (protocol) => protocol !== 'about:',
);

/**
 * Checks that a remotely supplied URL (e.g. a provider link returned by the
 * on-ramp aggregator API) is an absolute http(s) URL before it is handed to
 * Linking.openURL, so custom schemes such as `intent:` or `metamask:` are
 * never launched from Ramp screens.
 */
const hasWhitespaceOrControlChar = (value: string) => {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
};

export default function isSafeExternalUrl(url?: string | null): url is string {
  // Validate the exact string that will be launched: url-parse silently strips
  // leading whitespace/control characters, which the OS URL parser may not.
  if (
    typeof url !== 'string' ||
    url.length === 0 ||
    hasWhitespaceOrControlChar(url)
  ) {
    return false;
  }
  try {
    const { protocol, hostname } = new Url(url, {});
    return (
      EXTERNAL_LINK_PROTOCOLS.includes(protocol.toLowerCase()) &&
      hostname.length > 0
    );
  } catch {
    return false;
  }
}
