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


const skipWhitespace = (raw: string, index: number): number => {
  let i = index;
  while (i < raw.length && /\s/u.test(raw[i])) {
    i++;
  }
  return i;
};

/** Returns the index just after the string literal that starts at `raw[index]` (a `"`). */
const endOfString = (raw: string, index: number): number => {
  let i = index + 1;
  while (i < raw.length) {
    const char = raw[i];
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (char === '"') {
      return i + 1;
    }
    i++;
  }
  throw new Error('Unterminated string in typed data');
};

/** Returns the index just after the JSON value that starts at `raw[index]`. */
const endOfValue = (raw: string, index: number): number => {
  const char = raw[index];

  if (char === '"') {
    return endOfString(raw, index);
  }

  if (char === '{' || char === '[') {
    const close = char === '{' ? '}' : ']';
    let i = index + 1;
    while (i < raw.length) {
      i = skipWhitespace(raw, i);
      const current = raw[i];
      if (current === close) {
        return i + 1;
      }
      if (current === '"') {
        i = endOfString(raw, i);
        continue;
      }
      if (current === '{' || current === '[') {
        i = endOfValue(raw, i);
        continue;
      }
      i++;
    }
    throw new Error('Unterminated object or array in typed data');
  }

  // Primitive value (number, true, false, null).
  let i = index;
  while (i < raw.length && !/[,}\]\s]/u.test(raw[i])) {
    i++;
  }
  return i;
};

/**
 * Returns the raw, unparsed source token of a value addressed by `path` within the
 * JSON string `raw`, or undefined if it cannot be resolved.
 *
 * The scan is string/brace/bracket aware and only descends into the value that is a
 * direct member of each object on the path. This means it returns the genuine
 * top-level `message.value` and never a nested (e.g. attacker-controlled decoy)
 * field that happens to share the same key.
 *
 * Duplicate keys are resolved last-wins to match `JSON.parse`, so the returned token
 * always corresponds to the value the parsed object actually represents.
 */
const getRawValueAtPath = (
  raw: string,
  path: string[],
): string | undefined => {
  let objectStart = skipWhitespace(raw, 0);

  for (let depth = 0; depth < path.length; depth++) {
    const key = path[depth];
    if (raw[objectStart] !== '{') {
      return undefined;
    }

    let i = objectStart + 1;
    let valueSpan: { start: number; end: number } | undefined;

    while (i < raw.length) {
      i = skipWhitespace(raw, i);
      if (raw[i] === '}') {
        break;
      }
      if (raw[i] !== '"') {
        return undefined;
      }

      const keyEnd = endOfString(raw, i);
      const memberKey = JSON.parse(raw.slice(i, keyEnd));

      i = skipWhitespace(raw, keyEnd);
      if (raw[i] !== ':') {
        return undefined;
      }

      const valueStart = skipWhitespace(raw, i + 1);
      const valueEnd = endOfValue(raw, valueStart);

      // Keep scanning rather than stopping at the first match: JSON.parse resolves
      // duplicate keys last-wins, so the last matching member is the genuine value.
      if (memberKey === key) {
        valueSpan = { start: valueStart, end: valueEnd };
      }

      i = skipWhitespace(raw, valueEnd);
      if (raw[i] === ',') {
        i++;
        continue;
      }
      break;
    }

    if (!valueSpan) {
      return undefined;
    }

    if (depth === path.length - 1) {
      return raw.slice(valueSpan.start, valueSpan.end).trim();
    }

    objectStart = skipWhitespace(raw, valueSpan.start);
  }

  return undefined;
};

/**
 * JSON.parse coerces integers greater than Number.MAX_SAFE_INTEGER to scientific
 * notation, losing precision. A JSON.parse reviver cannot recover this because the
 * value is already coerced by the time the reviver runs.
 *
 * To display the genuine value with full precision, the raw source token of the
 * top-level `message.value` is read directly from the JSON string. The token is
 * only used when it is a plain integer that round-trips to the parsed number, which
 * guarantees the displayed value is the same field that is actually signed. This
 * prevents a spoofing attack where a nested decoy `value` field could otherwise be
 * substituted for the real one.
 */
const normalizeMessageValue = (
  messageParamsData: string,
  parsedValue: unknown,
): unknown => {
  // Precision loss only affects numeric literals; other types are already exact.
  if (typeof parsedValue !== 'number') {
    return String(parsedValue);
  }

  const rawValue = getRawValueAtPath(messageParamsData, ['message', 'value']);

  if (
    rawValue &&
    /^\d+$/u.test(rawValue) &&
    Number(rawValue) === parsedValue
  ) {
    return rawValue;
  }

  return String(parsedValue);
};

export const parseAndNormalizeSignTypedData = (messageParamsData: string) => {
  const result = JSON.parse(messageParamsData);

  if (result.message?.value) {
    result.message.value = normalizeMessageValue(
      messageParamsData,
      result.message.value,
    );
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
