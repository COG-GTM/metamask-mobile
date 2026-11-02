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
export default function isSafeExternalUrl(url?: string | null): url is string {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }
  try {
    const { protocol, hostname } = new Url(url.trim(), {});
    return (
      EXTERNAL_LINK_PROTOCOLS.includes(protocol.toLowerCase()) &&
      hostname.length > 0
    );
  } catch {
    return false;
  }
}
