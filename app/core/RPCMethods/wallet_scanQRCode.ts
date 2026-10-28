import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { isWalletOnlyQRContent } from '../../util/validators';

export const MAX_SCAN_QR_CODE_PATTERN_LENGTH = 256;
export const SCAN_QR_CODE_USER_CANCELLED = 'USER_CANCELLED';
export const SCAN_QR_CODE_WALLET_ONLY_CONTENT = 'DAPP_SCAN_WALLET_ONLY_CONTENT';

const WALLET_ONLY_FIELDS = ['seed', 'private_key', 'walletConnectURI'];

const walletOnlyContentError = () =>
  providerErrors.unauthorized({
    message:
      'wallet_scanQRCode does not return Secret Recovery Phrases, private keys or wallet connection data.',
  });

/**
 * Validates the optional EIP-945 regex parameter of wallet_scanQRCode.
 *
 * @param pattern - `req.params[0]` as sent by the dapp.
 * @returns The compiled matcher, or undefined when no pattern was provided.
 */
export function buildScanQRCodeMatcher(pattern: unknown): RegExp | undefined {
  if (pattern === undefined || pattern === null) {
    return undefined;
  }
  if (
    typeof pattern !== 'string' ||
    pattern.length > MAX_SCAN_QR_CODE_PATTERN_LENGTH
  ) {
    throw rpcErrors.invalidParams({
      message: `wallet_scanQRCode expects an optional regular expression string of at most ${MAX_SCAN_QR_CODE_PATTERN_LENGTH} characters.`,
    });
  }
  try {
    return new RegExp(pattern);
  } catch {
    throw rpcErrors.invalidParams({
      message: 'wallet_scanQRCode received an invalid regular expression.',
    });
  }
}

const getScannedText = (data: unknown, content?: string) => {
  if (typeof content === 'string') {
    return content;
  }
  if (typeof data === 'string') {
    return data;
  }
  const dataContent = (data as { content?: unknown } | undefined)?.content;
  return typeof dataContent === 'string' ? dataContent : undefined;
};

/**
 * Turns a scanner result into the value returned to the dapp: always the raw
 * scanned text (EIP-945), never scanner-internal objects or wallet secrets.
 *
 * @param data - First argument of the scanner's onScanSuccess callback.
 * @param content - Raw scanned text (second onScanSuccess argument).
 * @param matcher - Optional dapp-supplied matcher.
 * @returns The scanned text.
 */
export function getScanQRCodeResult(
  data: unknown,
  content: string | undefined,
  matcher: RegExp | undefined,
): string {
  if (
    data &&
    typeof data === 'object' &&
    WALLET_ONLY_FIELDS.some((field) => field in data)
  ) {
    throw walletOnlyContentError();
  }
  const text = getScannedText(data, content);
  if (text === undefined) {
    throw rpcErrors.internal({
      message: 'wallet_scanQRCode did not receive scanned text.',
    });
  }
  if (isWalletOnlyQRContent(text)) {
    throw walletOnlyContentError();
  }
  if (matcher && !matcher.exec(text)) {
    throw rpcErrors.invalidRequest({ message: 'NO_REGEX_MATCH' });
  }
  return text;
}

/**
 * Maps a scanner error to the JSON-RPC error returned to the dapp.
 *
 * @param error - Value passed to the scanner's onScanError callback.
 * @returns A JSON-RPC error.
 */
export function getScanQRCodeError(error: unknown) {
  if (error === SCAN_QR_CODE_USER_CANCELLED) {
    return providerErrors.userRejectedRequest();
  }
  if (error === SCAN_QR_CODE_WALLET_ONLY_CONTENT) {
    return walletOnlyContentError();
  }
  return rpcErrors.internal({ message: String(error) });
}
