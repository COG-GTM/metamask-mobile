export const APPROVE_HOST = 'APPROVE_HOST' as const;
export const REJECT_HOST = 'REJECT_HOST' as const;
export const RECORD_SRP_REVEAL_TIMESTAMP =
  'RECORD_SRP_REVEAL_TIMESTAMP' as const;

interface HostAction {
  type: typeof APPROVE_HOST | typeof REJECT_HOST;
  hostname: unknown;
}

interface RecordSrpRevealTimestampAction {
  type: typeof RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: unknown;
}

export type Action = HostAction | RecordSrpRevealTimestampAction;

export function approveHost(hostname: unknown): HostAction {
  return {
    type: APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: unknown): HostAction {
  return {
    type: REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(
  timestamp: unknown,
): RecordSrpRevealTimestampAction {
  return {
    type: RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
