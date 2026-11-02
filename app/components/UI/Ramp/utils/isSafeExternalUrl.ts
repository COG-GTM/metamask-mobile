import Url from 'url-parse';
import { protocolAllowList } from '../../../../util/browser';

const EXTERNAL_LINK_PROTOCOLS = protocolAllowList.filter(
  (protocol) => protocol !== 'about:',
);

/**
 * Returns true if the value contains whitespace or an ASCII control character
 * (code point <= 0x20 or DEL), which URL parsers may silently strip.
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

/**
 * Checks that a remotely supplied URL (e.g. a provider link returned by the
 * on-ramp aggregator API) is an absolute http(s) URL before it is handed to
 * Linking.openURL, so custom schemes such as `intent:` or `metamask:` are
 * never launched from Ramp screens. The exact string is validated (no
 * trimming) and values containing whitespace or control characters are
 * rejected, so the validated value is the one that gets launched.
 */
export default function isSafeExternalUrl(url?: string | null): url is string {
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
