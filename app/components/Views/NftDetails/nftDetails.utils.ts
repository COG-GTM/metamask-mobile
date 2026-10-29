import Url from 'url-parse';
import { prefixUrlWithProtocol } from '../../../util/browser';

const MAX_TOKEN_ID_LENGTH = 15;

const HOSTNAME_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/**
 * Validates a marketplace URL coming from third-party NFT market data.
 * Only https URLs with a plain hostname and no credentials are allowed.
 *
 * @param rawUrl - URL or bare domain from NFT market data
 * @returns The normalized https URL, or undefined if it is not safe to open
 */
export const getSafeMarketplaceUrl = (rawUrl?: string): string | undefined => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return undefined;
  }
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return undefined;
  }
  try {
    const url = new Url(prefixUrlWithProtocol(trimmedUrl));
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !HOSTNAME_REGEX.test(url.hostname)
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
};

export default MAX_TOKEN_ID_LENGTH;
