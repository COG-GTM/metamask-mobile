import { failedSeedPhraseRequirements, isValidMnemonic } from '../validators';

export const SECRET_QR_CODE_ERROR = 'SECRET_QR_CODE_NOT_ALLOWED';

const PRIVATE_KEY_REGEX = /^(0x)?[0-9a-f]{64}$/iu;
const SECRET_FIELDS = ['seed', 'private_key', 'walletConnectURI'] as const;

const isMnemonic = (text: string): boolean => {
  const normalized = text.trim().toLowerCase().replace(/\s+/gu, ' ');
  if (failedSeedPhraseRequirements(normalized)) return false;
  try {
    return isValidMnemonic(normalized);
  } catch {
    return false;
  }
};

/**
 * Returns true when scanned QR text holds a Secret Recovery Phrase, a raw
 * private key or a WalletConnect pairing URI, none of which may be handed to
 * an untrusted caller such as a dapp.
 */
export const isSecretQRContent = (content: unknown): boolean => {
  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  return (
    PRIVATE_KEY_REGEX.test(trimmed) ||
    trimmed.includes('wc:') ||
    isMnemonic(trimmed)
  );
};

/**
 * Returns true when a QR scanner result (parsed object and/or raw text)
 * contains secret wallet data.
 */
export const containsSecretQRData = (
  data: unknown,
  content?: unknown,
): boolean => {
  if (isSecretQRContent(content) || isSecretQRContent(data)) return true;
  if (data && typeof data === 'object') {
    return SECRET_FIELDS.some(
      (field) => (data as Record<string, unknown>)[field] !== undefined,
    );
  }
  return false;
};
