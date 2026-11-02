import { OriginatorInfo } from '@metamask/sdk-communication-layer';

/**
 * Checks that a value received from a dapp (or loaded from storage) has the
 * minimum OriginatorInfo shape the SDK services dereference.
 */
const isValidOriginatorInfo = (value: unknown): value is OriginatorInfo => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const { url, title } = value as { url?: unknown; title?: unknown };

  return (
    typeof url === 'string' &&
    url.length > 0 &&
    typeof title === 'string' &&
    title.length > 0
  );
};

export default isValidOriginatorInfo;
