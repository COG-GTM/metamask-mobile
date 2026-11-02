import { Verify } from '@walletconnect/types';

/**
 * WalletConnect sessions get their own PermissionController subject so that a
 * dapp connecting over WalletConnect can never read or modify the grant of a
 * site opened in the in-app browser (whose subject is a bare hostname).
 *
 * Format: `<hostname>#wc-<verified|unverified>-<pairingTopic>`. `#` can never
 * appear in a URL hostname, so the subject cannot collide with a browser
 * subject, and the pairing topic keeps unrelated WalletConnect pairings apart.
 */
const WC_SUBJECT_REGEX = /^(.*)#wc-(verified|unverified)-([^#]+)$/;

export type WalletConnectValidation = Verify.Context['verified']['validation'];

export interface WalletConnectVerification {
  validation: WalletConnectValidation;
  isScam: boolean;
  /** True only when the Verify API attested the dapp's claimed origin. */
  isVerified: boolean;
  /** Hostname to display and to key the permission subject with. */
  hostname: string;
}

export interface WalletConnectPermissionSubject {
  hostname: string;
  isVerified: boolean;
  pairingTopic: string;
}

const safeHostname = (url?: string): string => {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

export const getWalletConnectVerification = (
  verifyContext: Verify.Context | undefined,
  metadataUrl: string | undefined,
): WalletConnectVerification => {
  const verified = verifyContext?.verified;
  const validation: WalletConnectValidation =
    verified?.validation === 'VALID' || verified?.validation === 'INVALID'
      ? verified.validation
      : 'UNKNOWN';
  const isScam = verified?.isScam === true;
  const claimedHostname = safeHostname(metadataUrl);
  const attestedHostname = safeHostname(verified?.origin);

  const isVerified =
    validation === 'VALID' &&
    !isScam &&
    attestedHostname !== '' &&
    attestedHostname === claimedHostname;

  // For INVALID the Verify API reports the origin the request really came
  // from, which is more truthful than the dapp's self-declared URL.
  const hostname =
    isVerified || (validation === 'INVALID' && attestedHostname)
      ? attestedHostname
      : claimedHostname;

  return { validation, isScam, isVerified, hostname };
};

export const buildWalletConnectPermissionSubject = ({
  hostname,
  isVerified,
  pairingTopic,
}: WalletConnectPermissionSubject): string =>
  `${hostname || 'unknown'}#wc-${
    isVerified ? 'verified' : 'unverified'
  }-${pairingTopic}`;

export const parseWalletConnectPermissionSubject = (
  subject: string | undefined,
): WalletConnectPermissionSubject | undefined => {
  if (typeof subject !== 'string') return undefined;
  const match = subject.match(WC_SUBJECT_REGEX);
  if (!match) return undefined;
  return {
    hostname: match[1],
    isVerified: match[2] === 'verified',
    pairingTopic: match[3],
  };
};

export const isWalletConnectPermissionSubject = (
  subject: string | undefined,
): boolean => parseWalletConnectPermissionSubject(subject) !== undefined;

export const findWalletConnectPermissionSubject = (
  subjects: string[],
  pairingTopic: string,
): string | undefined =>
  subjects.find(
    (subject) =>
      parseWalletConnectPermissionSubject(subject)?.pairingTopic ===
      pairingTopic,
  );
