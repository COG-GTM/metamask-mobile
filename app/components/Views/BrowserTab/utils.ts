import AppConstants from '../../../core/AppConstants';
import URLParse from 'url-parse';
import { encode as encodeContentHash } from 'content-hash';
import { SessionENSNames } from './types';

/**
 * Validates url for browser
 *
 * Regular domains (e.g., google.com)
 * Localhost URLs (e.g., http://localhost:3000)
 * URLs with ports (e.g., http://localhost:1234)
 * HTTPS/HTTP protocols
 *
 * @param url - The url to validate
 * @returns
 */
export const isValidUrl = (url: URLParse<string>): boolean => {
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
  try {
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (urlPattern.test(url.origin) || url.hostname === 'localhost')
    );
  } catch {
    return false;
  }
};

/**
 * Checks if it is a ENS website
 */
export const isENSUrl = (urlToCheck: string, ensIgnoreList: string[]) => {
  const { hostname } = new URLParse(urlToCheck);
  const tld = hostname.split('.').pop();
  if (
    tld &&
    AppConstants.supportedTLDs.indexOf(
      tld.toLowerCase() as 'eth' | 'xyz' | 'test',
    ) !== -1
  ) {
    // Make sure it's not in the ignore list
    if (ensIgnoreList.indexOf(hostname) === -1) {
      return true;
    }
  }
  return false;
};

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

const toBase32 = (bytes: number[]) => {
  let output = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
};

/**
 * Converts a decoded ENS content hash (ipfs-ns / swarm-ns) into a base32 CIDv1,
 * the case-insensitive form required in a subdomain gateway hostname
 */
export const toCidV1Base32 = (type: string, hash: string) => {
  const hex = encodeContentHash(type, hash);
  const bytes = (hex.match(/../g) ?? []).map((byte) => parseInt(byte, 16));
  // Drop the 2-byte varint multicodec prefix (0xe301 / 0xe401) to keep the CID bytes
  return `b${toBase32(bytes.slice(2))}`;
};

/**
 * Encodes a DNS name as a single DNS label for subdomain gateways ("my-app.eth" -> "my--app-eth")
 */
export const toInlinedDnsLabel = (name: string) =>
  name.toLowerCase().replace(/-/g, '--').replace(/\./g, '-');

/**
 * Builds the gateway url for resolved ENS content.
 * Subdomain gateways are used so that every ENS site gets its own web origin,
 * and therefore its own permission subject, instead of sharing the gateway hostname.
 */
export const getEnsContentGatewayUrl = ({
  type,
  hash,
  hostname,
  pathname,
  query,
}: {
  type: string;
  hash: string;
  hostname: string;
  pathname?: string;
  query?: string;
}): string | undefined => {
  const path = `${pathname || '/'}${query || ''}`;
  if (type === 'ipfs-ns') {
    return `https://${toCidV1Base32(type, hash)}.${
      AppConstants.IPFS_SUBDOMAIN_GATEWAY_HOST
    }${path}`;
  }
  if (type === 'swarm-ns') {
    return `https://${toCidV1Base32(type, hash)}.${
      AppConstants.SWARM_SUBDOMAIN_GATEWAY_HOST
    }${path}`;
  }
  if (type === 'ipns-ns') {
    return `https://${toInlinedDnsLabel(hostname)}.${
      AppConstants.IPNS_SUBDOMAIN_GATEWAY_HOST
    }${path}`;
  }
  return undefined;
};

/**
 * Gets the url to be displayed to the user
 * For example, if it's ens then show [site].eth instead of ipfs url
 */
export const getMaskedUrl = (
  urlToMask: string,
  sessionENSNames: SessionENSNames,
) => {
  if (!urlToMask) return urlToMask;
  const { origin } = new URLParse(urlToMask);
  const key = Object.keys(sessionENSNames).find(
    (ensUrl) => new URLParse(ensUrl).origin === origin,
  );
  if (!key) return urlToMask;
  return `https://${sessionENSNames[key].hostname}${urlToMask.slice(
    origin.length,
  )}`;
};
