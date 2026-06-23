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


/**
 * Rewrites every numeric literal in a JSON string as a quoted string while leaving
 * the contents of string literals (including object keys) untouched. The structural
 * shape of the JSON is preserved, so parsing the result yields the same object tree
 * with every number replaced by its exact source digits as a string.
 *
 * This is used to recover full precision for integers that exceed
 * Number.MAX_SAFE_INTEGER, which JSON.parse would otherwise coerce into lossy
 * scientific notation (e.g. 3.000123123123121e+26).
 */
function stringifyJsonNumbersAsStrings(source: string): string {
  let output = '';
  let inString = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inString) {
      output += char;
      if (char === '\\') {
        // Copy the escaped character verbatim so quotes/backslashes inside
        // strings do not terminate the string early.
        i += 1;
        output += source[i] ?? '';
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    // Outside of string literals, the only tokens that can begin with a digit or
    // a minus sign are JSON numbers (keys are always quoted strings), so it is
    // safe to quote them.
    if (char === '-' || (char >= '0' && char <= '9')) {
      let token = '';
      while (i < source.length && /[-+0-9.eE]/u.test(source[i])) {
        token += source[i];
        i += 1;
      }
      i -= 1;
      output += `"${token}"`;
      continue;
    }

    output += char;
  }

  return output;
}

/**
 * JSON.parse coerces numbers greater than Number.MAX_SAFE_INTEGER into scientific
 * notation, causing a loss in precision. Aside from precision concerns, passing
 * such a value (e.g. 3.000123123123121e+26) to BigNumber throws:
 * Error: new BigNumber() number type has more than 15 significant digits
 *
 * To preserve precision we re-parse the same payload with every numeric literal
 * rewritten as a string, then read the displayed `message.value` from that
 * structurally-identical parse. Deriving the value from a real parse (rather than
 * a regex scan of the raw text) ensures the displayed amount always corresponds to
 * the top-level `message.value` that is actually signed — it cannot be diverted by
 * an attacker-supplied decoy field nested elsewhere in the message.
 */
export const parseAndNormalizeSignTypedData = (messageParamsData: string) => {
  const result = JSON.parse(messageParamsData);

  if (result.message?.value) {
    const precisionPreservedValue = JSON.parse(
      stringifyJsonNumbersAsStrings(messageParamsData),
    )?.message?.value;

    result.message.value =
      precisionPreservedValue === undefined || precisionPreservedValue === null
        ? String(result.message.value)
        : String(precisionPreservedValue);
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
