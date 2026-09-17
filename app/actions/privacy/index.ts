export const APPROVE_HOST = 'APPROVE_HOST' as const;
export const REJECT_HOST = 'REJECT_HOST' as const;
export const RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP' as const;

export function approveHost(hostname: string) {
  return {
    type: APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: string) {
  return {
    type: REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(timestamp: number) {
  return {
    type: RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
