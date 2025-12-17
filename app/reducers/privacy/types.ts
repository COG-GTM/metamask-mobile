/**
 * Approved hosts mapping
 */
export type ApprovedHosts = Record<string, boolean>;

/**
 * Privacy reducer state
 */
export interface PrivacyState {
  approvedHosts: ApprovedHosts;
  revealSRPTimestamps: number[];
}
