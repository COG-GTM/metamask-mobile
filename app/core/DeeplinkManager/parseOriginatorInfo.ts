import { OriginatorInfo } from '@metamask/sdk-communication-layer';

/**
 * Parses and validates a base64-encoded JSON string into an OriginatorInfo object.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.base64OriginatorInfo - A base64-encoded JSON string representing OriginatorInfo.
 * @returns {OriginatorInfo} The parsed and validated OriginatorInfo object.
 * @throws {Error} If the input is an invalid base64 string, contains invalid JSON, or doesn't match the OriginatorInfo structure.
 */
const parseOriginatorInfo = ({
  base64OriginatorInfo,
}: {
  base64OriginatorInfo: string;
}): OriginatorInfo => {
  let decodedOriginatorInfo: string;

  try {
    decodedOriginatorInfo = Buffer.from(
      base64OriginatorInfo,
      'base64',
    ).toString('utf-8');

    // Check if the decoded string is valid UTF-8
    if (
      Buffer.from(decodedOriginatorInfo, 'utf-8').toString('base64') !==
      base64OriginatorInfo
    ) {
      throw new Error('Invalid base64 string');
    }
  } catch (error) {
    throw new Error('Invalid base64 string');
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(decodedOriginatorInfo);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  if (!isOriginatorInfo(parsedData)) {
    throw new Error('Invalid OriginatorInfo structure');
  }

  return sanitizeOriginatorInfo(parsedData);
};

const ALLOWED_URL_PROTOCOLS = ['https:', 'http:'];

export const ORIGINATOR_INFO_MAX_URL_LENGTH = 2048;
export const ORIGINATOR_INFO_MAX_FIELD_LENGTH = 256;
export const ORIGINATOR_INFO_MAX_ICON_LENGTH = 65536;

const OPTIONAL_TEXT_FIELDS = [
  'scheme',
  'source',
  'apiVersion',
  'connector',
] as const;

/**
 * Normalizes link-supplied (unverified) originator metadata: only known fields
 * are kept, the url must be http(s) and is reduced to its origin, text fields
 * are length-capped, and icons that are not https or inline images are dropped.
 */
function sanitizeOriginatorInfo(info: OriginatorInfo): OriginatorInfo {
  if (info.url.length > ORIGINATOR_INFO_MAX_URL_LENGTH) {
    throw new Error('Invalid OriginatorInfo url');
  }

  let url: string;
  try {
    const urlObj = new URL(info.url);
    if (!ALLOWED_URL_PROTOCOLS.includes(urlObj.protocol) || !urlObj.hostname) {
      throw new Error('Invalid OriginatorInfo url');
    }
    url = urlObj.origin;
  } catch (e) {
    throw new Error('Invalid OriginatorInfo url');
  }

  const sanitized: OriginatorInfo = {
    url,
    title: info.title,
    platform: info.platform,
    dappId: info.dappId,
  };

  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (info[field] !== undefined) {
      sanitized[field] = info[field];
    }
  }

  const textValues = [
    sanitized.title,
    sanitized.platform,
    sanitized.dappId,
    ...OPTIONAL_TEXT_FIELDS.map((field) => sanitized[field]),
  ];
  if (
    textValues.some(
      (value) =>
        value !== undefined && value.length > ORIGINATOR_INFO_MAX_FIELD_LENGTH,
    )
  ) {
    throw new Error('Invalid OriginatorInfo structure');
  }

  if (
    info.icon &&
    info.icon.length <= ORIGINATOR_INFO_MAX_ICON_LENGTH &&
    (info.icon.startsWith('https://') || info.icon.startsWith('data:image/'))
  ) {
    sanitized.icon = info.icon;
  }

  return sanitized;
}

/**
 * Type guard to validate if the given data conforms to the OriginatorInfo interface.
 *
 * @param {unknown} data - The data to be validated.
 * @returns {boolean} True if the data conforms to the OriginatorInfo interface, false otherwise.
 */
function isOriginatorInfo(data: unknown): data is OriginatorInfo {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const {
    url,
    title,
    platform,
    dappId,
    icon,
    scheme,
    source,
    apiVersion,
    connector,
  } = data as Partial<OriginatorInfo>;

  return (
    typeof url === 'string' &&
    typeof title === 'string' &&
    typeof platform === 'string' &&
    typeof dappId === 'string' &&
    (icon === undefined || typeof icon === 'string') &&
    (scheme === undefined || typeof scheme === 'string') &&
    (source === undefined || typeof source === 'string') &&
    (apiVersion === undefined || typeof apiVersion === 'string') &&
    (connector === undefined || typeof connector === 'string')
  );
}

export default parseOriginatorInfo;
