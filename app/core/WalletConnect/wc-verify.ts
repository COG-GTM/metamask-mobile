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

const safeUrl = (url?: string): URL | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

/**
 * Derives a WalletConnect dapp's identity from the Verify API result.
 *
 * @param verifyContext - `verifyContext` attached to the proposal or request.
 * @param metadataUrl - The dapp's self-declared `metadata.url`.
 * @returns Validation status, scam flag, whether the claimed origin was
 * attested, and the hostname to display and key permissions with.
 */
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
  const claimedUrl = safeUrl(metadataUrl);
  const attestedUrl = safeUrl(verified?.origin);
  const claimedHostname = claimedUrl?.hostname.toLowerCase() ?? '';
  const attestedHostname = attestedUrl?.hostname.toLowerCase() ?? '';

  // Compare full origins (scheme + host + port), not just hostnames.
  const isVerified =
    validation === 'VALID' &&
    !isScam &&
    attestedUrl !== undefined &&
    claimedUrl !== undefined &&
    attestedUrl.origin !== 'null' &&
    attestedUrl.origin === claimedUrl.origin;

  // For INVALID the Verify API reports the origin the request really came
  // from, which is more truthful than the dapp's self-declared URL.
  const hostname =
    isVerified || (validation === 'INVALID' && attestedHostname)
      ? attestedHostname
      : claimedHostname;

  return { validation, isScam, isVerified, hostname };
};

/**
 * Builds the PermissionController subject for a WalletConnect pairing.
 *
 * @param subject - Hostname, verification status and pairing topic.
 * @returns `<hostname>#wc-<verified|unverified>-<pairingTopic>`.
 */
export const buildWalletConnectPermissionSubject = ({
  hostname,
  isVerified,
  pairingTopic,
}: WalletConnectPermissionSubject): string =>
  `${hostname || 'unknown'}#wc-${
    isVerified ? 'verified' : 'unverified'
  }-${pairingTopic}`;

/**
 * Parses a WalletConnect permission subject.
 *
 * @param subject - A PermissionController subject.
 * @returns The subject's parts, or `undefined` if it is not a WalletConnect subject.
 */
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

/**
 * Checks whether a PermissionController subject belongs to WalletConnect.
 *
 * @param subject - A PermissionController subject.
 * @returns True for subjects built by `buildWalletConnectPermissionSubject`.
 */
export const isWalletConnectPermissionSubject = (
  subject: string | undefined,
): boolean => parseWalletConnectPermissionSubject(subject) !== undefined;

/**
 * Finds the WalletConnect permission subject of a pairing.
 *
 * @param subjects - PermissionController subject keys.
 * @param pairingTopic - The WalletConnect pairing topic.
 * @returns The first subject for that pairing, if any.
 */
export const findWalletConnectPermissionSubject = (
  subjects: string[],
  pairingTopic: string,
): string | undefined =>
  subjects.find(
    (subject) =>
      parseWalletConnectPermissionSubject(subject)?.pairingTopic ===
      pairingTopic,
  );
