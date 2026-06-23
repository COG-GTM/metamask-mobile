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


const JSON_WHITESPACE = /\s/u;

interface RawJsonValue {
  text: string;
  isNumber: boolean;
}

/**
 * Walks the raw JSON string, descending through the given object-key path, and
 * returns the raw source text of the value at that path (plus whether that value
 * is a JSON number).
 *
 * Unlike a regex, the scanner is string- and nesting-aware: keys are only matched
 * at the depth of the object currently being descended into, so a nested field
 * sharing the targeted name (e.g. a decoy `message.<x>.value`) can never be
 * mistaken for the real top-level field. Returns undefined when the path does not
 * resolve to a value.
 */
function getRawJsonValueAtPath(
  raw: string,
  path: string[],
): RawJsonValue | undefined {
  let i = 0;
  const len = raw.length;

  const skipWhitespace = () => {
    while (i < len && JSON_WHITESPACE.test(raw[i])) {
      i++;
    }
  };

  // Reads a JSON string token starting at the opening quote and returns its
  // decoded value, leaving `i` just past the closing quote.
  const readString = (): string => {
    i++; // opening quote
    let out = '';
    while (i < len) {
      const ch = raw[i++];
      if (ch === '\\') {
        const esc = raw[i++];
        if (esc === 'u') {
          out += String.fromCharCode(parseInt(raw.slice(i, i + 4), 16));
          i += 4;
        } else {
          const escapes: Record<string, string> = {
            n: '\n',
            t: '\t',
            r: '\r',
            b: '\b',
            f: '\f',
          };
          out += escapes[esc] ?? esc;
        }
      } else if (ch === '"') {
        break;
      } else {
        out += ch;
      }
    }
    return out;
  };

  // Advances `i` past the JSON value that starts at the current position.
  const skipValue = () => {
    skipWhitespace();
    const ch = raw[i];
    if (ch === '"') {
      readString();
      return;
    }
    if (ch === '{' || ch === '[') {
      let depth = 0;
      while (i < len) {
        const c = raw[i];
        if (c === '"') {
          readString();
          continue;
        }
        if (c === '{' || c === '[') {
          depth++;
        } else if (c === '}' || c === ']') {
          depth--;
          if (depth === 0) {
            i++;
            return;
          }
        }
        i++;
      }
      return;
    }
    // primitive: number / true / false / null
    while (
      i < len &&
      raw[i] !== ',' &&
      raw[i] !== '}' &&
      raw[i] !== ']' &&
      !JSON_WHITESPACE.test(raw[i])
    ) {
      i++;
    }
  };

  for (let p = 0; p < path.length; p++) {
    const targetKey = path[p];
    const isLastSegment = p === path.length - 1;
    skipWhitespace();
    if (raw[i] !== '{') {
      return undefined;
    }
    i++; // enter object
    let descended = false;
    while (i < len) {
      skipWhitespace();
      if (raw[i] === '}') {
        i++;
        break;
      }
      if (raw[i] !== '"') {
        return undefined;
      }
      const key = readString();
      skipWhitespace();
      if (raw[i] !== ':') {
        return undefined;
      }
      i++; // colon
      skipWhitespace();
      if (key === targetKey) {
        if (isLastSegment) {
          const start = i;
          const firstChar = raw[i];
          const isNumber =
            firstChar === '-' || (firstChar >= '0' && firstChar <= '9');
          skipValue();
          return { text: raw.slice(start, i).trim(), isNumber };
        }
        descended = true;
        break;
      }
      skipValue();
      skipWhitespace();
      if (raw[i] === ',') {
        i++;
      }
    }
    if (!descended) {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Returns the canonical numeric string of the top-level `message.value` field,
 * preserving full integer precision, or undefined when `message.value` is absent
 * or is not a JSON number.
 *
 * This reads the value directly from its exact location in the raw request so the
 * displayed amount always corresponds to the field that is EIP-712 hashed and
 * signed. A previous regex-based implementation could be tricked by a decoy
 * nested `value` field into displaying a different (smaller) amount than the one
 * actually signed.
 */
function extractLargeMessageValue(messageParamsData: string): string | undefined {
  if (typeof messageParamsData !== 'string') {
    return undefined;
  }
  const rawValue = getRawJsonValueAtPath(messageParamsData, ['message', 'value']);
  if (rawValue?.isNumber) {
    return rawValue.text;
  }
  return undefined;
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
 * This function reads the canonical `message.value` literal straight from the raw
 * request (see {@link extractLargeMessageValue}) so the value shown to the user
 * matches the value that is actually signed, while still preserving precision for
 * large integers.
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
