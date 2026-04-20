export const APPROVE_HOST = 'APPROVE_HOST' as const;
export const REJECT_HOST = 'REJECT_HOST' as const;
export const RECORD_SRP_REVEAL_TIMESTAMP = 'RECORD_SRP_REVEAL_TIMESTAMP' as const;

interface ApproveHostAction {
  type: typeof APPROVE_HOST;
  hostname: string;
}

interface RejectHostAction {
  type: typeof REJECT_HOST;
  hostname: string;
}

interface RecordSRPRevealTimestampAction {
  type: typeof RECORD_SRP_REVEAL_TIMESTAMP;
  timestamp: number;
}

export type PrivacyAction =
  | ApproveHostAction
  | RejectHostAction
  | RecordSRPRevealTimestampAction;

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: APPROVE_HOST,
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: REJECT_HOST,
    hostname,
  };
}

export function recordSRPRevealTimestamp(
  timestamp: number,
): RecordSRPRevealTimestampAction {
  return {
    type: RECORD_SRP_REVEAL_TIMESTAMP,
    timestamp,
  };
}
