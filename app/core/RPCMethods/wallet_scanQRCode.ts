import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { isWalletOnlyQRContent } from '../../util/validators';

export const MAX_SCAN_QR_CODE_PATTERN_LENGTH = 256;
export const MAX_SCAN_QR_CODE_MATCH_LENGTH = 1024;
const MAX_SCAN_QR_CODE_MATCH_COST = 1e7;
export const SCAN_QR_CODE_USER_CANCELLED = 'USER_CANCELLED';
export const SCAN_QR_CODE_WALLET_ONLY_CONTENT = 'DAPP_SCAN_WALLET_ONLY_CONTENT';

const WALLET_ONLY_FIELDS = ['seed', 'private_key', 'walletConnectURI'];

const walletOnlyContentError = () =>
  providerErrors.unauthorized({
    message:
      'wallet_scanQRCode does not return Secret Recovery Phrases, private keys or wallet connection data.',
  });

const invalidPatternError = (reason: string) =>
  rpcErrors.invalidParams({
    message: `wallet_scanQRCode received an unsupported regular expression: ${reason}.`,
  });

interface PatternGroup {
  quantified: boolean;
  branches: number;
}

/**
 * Rejects dapp patterns that could backtrack catastrophically on the JS thread.
 * Backreferences, lookarounds and quantified groups that themselves contain a
 * quantifier or alternation are refused outright; for the rest, the product of
 * every quantifier's range and alternation's branches, times the number of start
 * positions, must stay within MAX_SCAN_QR_CODE_MATCH_COST for inputs of up to
 * MAX_SCAN_QR_CODE_MATCH_LENGTH characters.
 *
 * @param pattern - Dapp-supplied regular expression source.
 */
export function assertSafeScanPattern(pattern: string): void {
  const n = MAX_SCAN_QR_CODE_MATCH_LENGTH;
  const stack: PatternGroup[] = [{ quantified: false, branches: 1 }];
  let cost = n;
  let lastAtomWasComplexGroup = false;
  let canQuantify = false;
  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === '\\') {
      const next = pattern[i + 1];
      if (next === undefined) {
        throw invalidPatternError('trailing escape');
      }
      if (/[1-9k]/u.test(next)) {
        throw invalidPatternError('backreferences are not allowed');
      }
      i += 2;
      lastAtomWasComplexGroup = false;
      canQuantify = true;
      continue;
    }
    if (char === '[') {
      i++;
      if (pattern[i] === '^') i++;
      if (pattern[i] === ']') i++;
      while (i < pattern.length && pattern[i] !== ']') {
        i += pattern[i] === '\\' ? 2 : 1;
      }
      i++;
      lastAtomWasComplexGroup = false;
      canQuantify = true;
      continue;
    }
    if (char === '(') {
      if (pattern[i + 1] === '?') {
        const header = pattern.slice(i + 2, i + 4);
        if (/^(=|!|<=|<!)/u.test(header)) {
          throw invalidPatternError('lookarounds are not allowed');
        }
        if (header[0] === ':') {
          i += 3;
        } else if (header[0] === '<') {
          const close = pattern.indexOf('>', i);
          i = close === -1 ? pattern.length : close + 1;
        } else {
          i += 2;
        }
      } else {
        i++;
      }
      stack.push({ quantified: false, branches: 1 });
      canQuantify = false;
      continue;
    }
    if (char === ')') {
      const group = stack.pop();
      if (!group || stack.length === 0) {
        throw invalidPatternError('unbalanced parentheses');
      }
      cost *= group.branches;
      if (group.quantified) {
        stack[stack.length - 1].quantified = true;
      }
      lastAtomWasComplexGroup = group.quantified || group.branches > 1;
      canQuantify = true;
      i++;
      continue;
    }
    if (char === '|') {
      stack[stack.length - 1].branches++;
      canQuantify = false;
      i++;
      continue;
    }
    let width: number | undefined;
    let length = 1;
    if (char === '*' || char === '+') {
      width = n;
    } else if (char === '?') {
      width = 2;
    } else if (char === '{') {
      const bounds = /^\{(\d+)(,(\d*))?\}/u.exec(pattern.slice(i));
      if (bounds) {
        length = bounds[0].length;
        const min = Number(bounds[1]);
        if (bounds[2] === undefined) {
          width = 1;
        } else if (bounds[3] === '') {
          width = n;
        } else {
          width = Math.max(1, Number(bounds[3]) - min + 1);
        }
      }
    }
    if (width === undefined) {
      lastAtomWasComplexGroup = false;
      canQuantify = !['^', '$'].includes(char);
      i++;
      continue;
    }
    if (!canQuantify) {
      throw invalidPatternError('nothing to repeat');
    }
    if (lastAtomWasComplexGroup) {
      throw invalidPatternError('nested quantifiers are not allowed');
    }
    stack[stack.length - 1].quantified = true;
    cost *= width;
    if (cost > MAX_SCAN_QR_CODE_MATCH_COST) {
      throw invalidPatternError('pattern is too complex');
    }
    i += length;
    if (pattern[i] === '?') i++;
    canQuantify = false;
  }
  if (stack.length !== 1) {
    throw invalidPatternError('unbalanced parentheses');
  }
  cost *= stack[0].branches;
  if (cost > MAX_SCAN_QR_CODE_MATCH_COST) {
    throw invalidPatternError('pattern is too complex');
  }
}

/**
 * Validates the optional EIP-945 regex parameter of wallet_scanQRCode.
 *
 * @param params - `req.params` as sent by the dapp.
 * @returns The compiled matcher, or undefined when no pattern was provided.
 */
export function buildScanQRCodeMatcher(params: unknown): RegExp | undefined {
  if (params !== undefined && params !== null && !Array.isArray(params)) {
    throw rpcErrors.invalidParams({
      message: 'wallet_scanQRCode expects params to be an array.',
    });
  }
  const pattern = params?.[0];
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
  let matcher: RegExp;
  try {
    matcher = new RegExp(pattern);
  } catch {
    throw rpcErrors.invalidParams({
      message: 'wallet_scanQRCode received an invalid regular expression.',
    });
  }
  assertSafeScanPattern(pattern);
  return matcher;
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
  if (
    matcher &&
    (text.length > MAX_SCAN_QR_CODE_MATCH_LENGTH || !matcher.exec(text))
  ) {
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
