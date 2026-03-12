export function approveHost(hostname: string) {
  return {
    type: 'APPROVE_HOST',
    hostname,
  };
}

export function rejectHost(hostname: string) {
  return {
    type: 'REJECT_HOST',
    hostname,
  };
}

export function recordSRPRevealTimestamp(timestamp: number) {
  return {
    type: 'RECORD_SRP_REVEAL_TIMESTAMP',
    timestamp,
  };
}
