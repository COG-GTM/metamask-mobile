export function approveHost(hostname: string) {
  return {
    type: 'APPROVE_HOST' as const,
    hostname,
  };
}

export function rejectHost(hostname: string) {
  return {
    type: 'REJECT_HOST' as const,
    hostname,
  };
}

export function recordSRPRevealTimestamp(timestamp: number) {
  return {
    type: 'RECORD_SRP_REVEAL_TIMESTAMP' as const,
    timestamp,
  };
}
