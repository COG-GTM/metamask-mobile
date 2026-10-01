import {
  MessageParamsPersonal,
  MessageParamsTyped,
  SignatureRequest,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';

import {
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
  PrimaryType,
} from '../constants/signatures';
import {
  isArrayType,
  isSolidityType,
  stripArrayType,
  stripMultipleNewlines,
  stripOneLayerofNesting,
 } from '../../../../util/string';
import { TOKEN_ADDRESS } from '../constants/tokens';
import BigNumber from 'bignumber.js';

type FieldValue = string | string[] | Record<string, unknown>;

interface BaseType {
  name: string;
  type: string;
}
interface TypedSignatureRequest {
  messageParams: MessageParamsTyped;
  type: SignatureRequestType.TypedSign;
}

interface ValueType {
  value: FieldValue | ValueType[];
  type: string;
}

/**
 * Support backwards compatibility DAI while it's still being deprecated. See EIP-2612 for more info.
 */
export const isPermitDaiUnlimited = (tokenAddress: string, allowed?: number|string|boolean) => {
  if (!tokenAddress) return false;

  return tokenAddress.toLowerCase() === TOKEN_ADDRESS.DAI.toLowerCase()
    && Number(allowed) > 0;
};

export const isPermitDaiRevoke = (tokenAddress: string, allowed?: number|string|boolean, value?: number|string|BigNumber) => {
  if (!tokenAddress) return false;

  return tokenAddress.toLowerCase() === TOKEN_ADDRESS.DAI.toLowerCase()
    && (
      allowed === 0
      || allowed === false
      || allowed === 'false'
      || value === '0'
      || (value instanceof BigNumber && value.eq(0))
    );
};

/**
 * Returns true if the request is Typed Sign V3 or V4 request
 *
 * @param signatureRequest - The signature request to check
 */
export const isTypedSignV3V4Request = (signatureRequest?: SignatureRequest) => {
  if (!signatureRequest) {
    return false;
  }

  const {
    type,
    messageParams: { version },
  } = signatureRequest as TypedSignatureRequest;

  return (
    type === SignatureRequestType.TypedSign &&
    (version === SignTypedDataVersion.V3 || version === SignTypedDataVersion.V4)
  );
};

/**
 * This is a recursive method accepts a parsed, signTypedData message. It removes message params
 * that do not have associated, valid solidity type definitions. It also strips multiple
 * new lines in strings.
 */
export const sanitizeParsedMessage = (
  message: FieldValue,
  primaryType: string,
  types: Record<string, BaseType[]> | undefined,
): ValueType => {
  if (!types) {
    throw new Error(`Invalid types definition`);
  }

  // Primary type can be an array.
  const isArray = primaryType && isArrayType(primaryType);
  if (isArray) {
    return {
      value: (message as string[]).map(
        (value: string): ValueType =>
          sanitizeParsedMessage(value, stripOneLayerofNesting(primaryType), types),
      ),
      type: primaryType,
    };
  } else if (isSolidityType(primaryType)) {
    return {
      value: stripMultipleNewlines(message) as ValueType['value'],
      type: primaryType,
    };
  }

  // If not, assume to be struct
  const baseType = isArray ? stripArrayType(primaryType) : primaryType;

  const baseTypeDefinitions = types[baseType];
  if (!baseTypeDefinitions) {
    throw new Error(`Invalid primary type definition`);
  }

  const sanitizedStruct = {};
  const msgKeys = Object.keys(message);
  msgKeys.forEach((msgKey: string) => {
    const definedType: BaseType | undefined = Object.values(
      baseTypeDefinitions,
    ).find(
      (baseTypeDefinition: BaseType) => baseTypeDefinition.name === msgKey,
    );

    if (!definedType) {
      return;
    }

    (sanitizedStruct as Record<string, ValueType>)[msgKey] = sanitizeParsedMessage(
      (message as Record<string, string>)[msgKey],
      definedType.type,
      types,
    );
  });
  return { value: sanitizedStruct, type: primaryType };
};


const LARGE_NUMBER_MIN_DIGITS = 15;

/**
 * Extracts the raw digits of the top-level `message.value` directly from the
 * EIP-712 JSON text, preserving full numeric precision.
 *
 * A regex cannot reliably do this: `value` fields can appear inside nested
 * structs, and a regex has no notion of object nesting, so it can capture a
 * nested `value` instead of the intended top-level `message.value`. That
 * mismatch would make the displayed amount diverge from the signed amount.
 *
 * Instead this walks the JSON with a small, brace-aware scanner and returns the
 * literal only when `value` is a *direct* child of the top-level `message`
 * object and is an unquoted integer with at least 15 digits (the case where
 * `JSON.parse` would otherwise lose precision). All other cases return
 * `undefined` so the caller falls back to the parsed value.
 */
function extractLargeMessageValue(
  messageParamsData: string,
): string | undefined {
  if (typeof messageParamsData !== 'string') {
    return undefined;
  }

  const text = messageParamsData;
  let pos = 0;

  const isWhitespace = (ch: string): boolean =>
    ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

  const skipWhitespace = (): void => {
    while (pos < text.length && isWhitespace(text[pos])) {
      pos++;
    }
  };

  // Reads a JSON string starting at the opening quote, advancing `pos` past the
  // closing quote and returning its decoded value.
  const readString = (): string => {
    pos++; // opening quote
    let out = '';
    while (pos < text.length) {
      const ch = text[pos];
      if (ch === '\\') {
        const next = text[pos + 1];
        switch (next) {
          case '"':
            out += '"';
            break;
          case '\\':
            out += '\\';
            break;
          case '/':
            out += '/';
            break;
          case 'b':
            out += '\b';
            break;
          case 'f':
            out += '\f';
            break;
          case 'n':
            out += '\n';
            break;
          case 'r':
            out += '\r';
            break;
          case 't':
            out += '\t';
            break;
          case 'u':
            out += String.fromCharCode(
              parseInt(text.substr(pos + 2, 4), 16),
            );
            pos += 4;
            break;
          default:
            out += next ?? '';
        }
        pos += 2;
      } else if (ch === '"') {
        pos++;
        return out;
      } else {
        out += ch;
        pos++;
      }
    }
    throw new Error('Unterminated string');
  };

  // Skips a single JSON value (string, object, array, number, or literal).
  function skipValue(): void {
    skipWhitespace();
    const ch = text[pos];
    if (ch === '"') {
      readString();
    } else if (ch === '{') {
      skipObject();
    } else if (ch === '[') {
      skipArray();
    } else {
      while (
        pos < text.length &&
        !isWhitespace(text[pos]) &&
        text[pos] !== ',' &&
        text[pos] !== '}' &&
        text[pos] !== ']'
      ) {
        pos++;
      }
    }
  }

  function skipArray(): void {
    pos++; // [
    skipWhitespace();
    if (text[pos] === ']') {
      pos++;
      return;
    }
    for (;;) {
      skipValue();
      skipWhitespace();
      if (text[pos] === ',') {
        pos++;
        continue;
      }
      if (text[pos] === ']') {
        pos++;
        return;
      }
      throw new Error('Malformed array');
    }
  }

  function skipObject(): void {
    pos++; // {
    skipWhitespace();
    if (text[pos] === '}') {
      pos++;
      return;
    }
    for (;;) {
      skipWhitespace();
      readString(); // key
      skipWhitespace();
      pos++; // :
      skipValue();
      skipWhitespace();
      if (text[pos] === ',') {
        pos++;
        continue;
      }
      if (text[pos] === '}') {
        pos++;
        return;
      }
      throw new Error('Malformed object');
    }
  }

  // Positions `pos` at the value of `targetKey` among the direct children of the
  // object whose opening brace is at `pos`. Returns true if found (with `pos` at
  // the value), false otherwise (with `pos` past the object's closing brace).
  const enterObjectAndFindKey = (targetKey: string): boolean => {
    skipWhitespace();
    if (text[pos] !== '{') {
      return false;
    }
    pos++; // {
    skipWhitespace();
    if (text[pos] === '}') {
      pos++;
      return false;
    }
    for (;;) {
      skipWhitespace();
      const key = readString();
      skipWhitespace();
      pos++; // :
      if (key === targetKey) {
        skipWhitespace();
        return true;
      }
      skipValue();
      skipWhitespace();
      if (text[pos] === ',') {
        pos++;
        continue;
      }
      return false;
    }
  };

  try {
    if (!enterObjectAndFindKey('message')) {
      return undefined;
    }
    if (!enterObjectAndFindKey('value')) {
      return undefined;
    }
    // `pos` is now at the start of the top-level message.value literal.
    if (
      text[pos] === '"' ||
      text[pos] === '{' ||
      text[pos] === '['
    ) {
      return undefined;
    }
    const start = pos;
    while (
      pos < text.length &&
      !isWhitespace(text[pos]) &&
      text[pos] !== ',' &&
      text[pos] !== '}' &&
      text[pos] !== ']'
    ) {
      pos++;
    }
    const raw = text.slice(start, pos);
    return new RegExp(`^\\d{${LARGE_NUMBER_MIN_DIGITS},}$`, 'u').test(raw)
      ? raw
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * JSON.parse has a limitation which coerces values to scientific notation if numbers are greater than
 * Number.MAX_SAFE_INTEGER. This can cause a loss in precision.
 *
 * Aside from precision concerns, if the value returned was a large number greater than 15 digits,
 * e.g. 3.000123123123121e+26, passing the value to BigNumber will throw the error:
 * Error: new BigNumber() number type has more than 15 significant digits
 *
 * Note that using JSON.parse reviver cannot help since the value will be coerced by the time it
 * reaches the reviver function.
 *
 * This function has a workaround to extract the large value from the message and replace
 * the message value with the string value.
 */
export const parseAndNormalizeSignTypedData = (messageParamsData: string) => {
  const result = JSON.parse(messageParamsData);

  const largeMessageValue = extractLargeMessageValue(messageParamsData);
  if (result.message?.value) {
    result.message.value = largeMessageValue || String(result.message.value);
  }

  return result;
};

export const parseAndSanitizeSignTypedData = (messageParamsData: string) => {
  if (!messageParamsData) { return {}; }

  const { domain, message, primaryType, types } = JSON.parse(messageParamsData);
  const sanitizedMessage = sanitizeParsedMessage(message, primaryType, types);

  return { sanitizedMessage, primaryType, domain };
};

export const parseNormalizeAndSanitizeSignTypedData = (messageParamsData: string) => {
  if (!messageParamsData) { return {}; }

  const { domain, message, primaryType, types } = parseAndNormalizeSignTypedData(messageParamsData);
  const sanitizedMessage = sanitizeParsedMessage(message, primaryType, types);

  return { sanitizedMessage, primaryType, domain };
};

export const parseAndNormalizeSignTypedDataFromSignatureRequest = (
  signatureRequest?: SignatureRequest,
) => {
  if (!signatureRequest || !isTypedSignV3V4Request(signatureRequest)) {
    return {};
  }

  const data = signatureRequest.messageParams?.data as string;
  return parseAndNormalizeSignTypedData(data);
};

const isRecognizedOfType = (
  request: SignatureRequest | undefined,
  types: PrimaryType[],
) => {
  const { primaryType } = parseAndNormalizeSignTypedDataFromSignatureRequest(request);
  return types.includes(primaryType);
};

/**
 * Returns true if the request is a recognized Permit Typed Sign signature request
 *
 * @param request - The signature request to check
 */
export const isRecognizedPermit = (request?: SignatureRequest) =>
  isRecognizedOfType(request, PRIMARY_TYPES_PERMIT);

/**
 * Returns true if the request is a recognized Order Typed Sign signature request
 *
 * @param request - The signature request to check
 */
export const isRecognizedOrder = (request?: SignatureRequest) =>
  isRecognizedOfType(request, PRIMARY_TYPES_ORDER);

export interface SIWEMessage {
  address: string;
  chainId: string;
  domain: string;
  issuedAt: string;
  nonce: string;
  statement: string;
  uri: string;
  version: string;
  requestId?: string;
  resources?: string[];
}

type MessageParamsSIWE = MessageParamsPersonal & {
  siwe: {
    isSIWEMessage: boolean;
    parsedMessage: SIWEMessage;
  };
};

export const isSIWESignatureRequest = (signatureRequest?: SignatureRequest) =>
  Boolean(
    (signatureRequest?.messageParams as MessageParamsSIWE)?.siwe?.isSIWEMessage,
  );

export const getSIWEDetails = (signatureRequest?: SignatureRequest) =>
  (signatureRequest?.messageParams as MessageParamsSIWE)?.siwe ?? {};
