import { ParseOutput, parse } from 'eth-url-parser';

export const MAX_ETHEREUM_URL_LENGTH = 2048;

const HEX_ADDRESS = '0x[0-9a-fA-F]{40}';
const ENS_NAME =
  '[A-Za-z0-9][A-Za-z0-9-]{0,62}(?:\\.[A-Za-z0-9-]{1,63}){0,8}\\.[A-Za-z]{2,63}';

/**
 * EIP-681 allowlist checked before handing a URL to `eth-url-parser`.
 *
 * `eth-url-parser` splices the prefix (text between `ethereum:` and the first
 * `-`) into a `RegExp` unescaped, so a prefix like `(.+)+!` hangs the JS
 * thread. Limiting the prefix to alphanumerics removes every regex
 * metacharacter from that splice.
 */
const ETHEREUM_URL_ALLOWLIST = new RegExp(
  `^ethereum:(?:[A-Za-z0-9]{1,32}-)?(?:${HEX_ADDRESS}|${ENS_NAME})` +
    '(?:@(?:0x[0-9a-fA-F]{1,64}|[0-9]{1,78}))?' +
    '(?:\\/[A-Za-z0-9_]{1,64})?' +
    '(?:\\?\\S*)?$',
);

/**
 * Checks whether a URL is a length-capped EIP-681 `ethereum:` URL that is
 * safe to pass to `eth-url-parser`.
 *
 * @param url - Untrusted value to check.
 * @returns True if the URL matches the allowlist.
 */
export const isValidEthereumUrl = (url: unknown): url is string =>
  typeof url === 'string' &&
  url.length <= MAX_ETHEREUM_URL_LENGTH &&
  ETHEREUM_URL_ALLOWLIST.test(url);

/**
 * Parses an EIP-681 `ethereum:` URL, rejecting anything outside the allowlist
 * before it reaches `eth-url-parser`.
 *
 * @param url - Untrusted `ethereum:` URL (deeplink, universal link or QR code).
 * @returns The parsed URL.
 * @throws If the URL is not an allowlisted EIP-681 URL or cannot be parsed.
 */
export default function parseEthereumUrl(url: string): ParseOutput {
  if (!isValidEthereumUrl(url)) {
    throw new Error('Invalid Ethereum URL');
  }
  return parse(url);
}
