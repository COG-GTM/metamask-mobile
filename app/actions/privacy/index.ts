export const APPROVE_HOST = 'APPROVE_HOST' as const;
export const REJECT_HOST = 'REJECT_HOST' as const;
export const CLEAR_HOSTS = 'CLEAR_HOSTS' as const;
export const RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP' as const;

export type PrivacyAction =
  | { type: typeof APPROVE_HOST; hostname: string }
  | { type: typeof REJECT_HOST; hostname: string }
  | { type: typeof CLEAR_HOSTS }
  | { type: typeof RECORD_SRP_REVEAL_TIMESTAMP; timestamp: number };

export function approveHost(hostname: string) {
  return {
    type: APPROVE_HOST,
    hostname,
  } as const;
}

export function rejectHost(hostname: string) {
  return {
    type: REJECT_HOST,
    hostname,
  } as const;
}

export function recordSRPRevealTimestamp(timestamp: number) {
  return {
    type: RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  } as const;
}
