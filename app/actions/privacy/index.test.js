import { approveHost, rejectHost, recordSRPRevealTimestamp } from '.';

describe('Privacy Actions', () => {
  it('approveHost should return correct action', () => {
    expect(approveHost('example.com')).toStrictEqual({
      type: 'APPROVE_HOST',
      hostname: 'example.com',
    });
  });

  it('rejectHost should return correct action', () => {
    expect(rejectHost('malicious.com')).toStrictEqual({
      type: 'REJECT_HOST',
      hostname: 'malicious.com',
    });
  });

  it('recordSRPRevealTimestamp should return correct action', () => {
    expect(recordSRPRevealTimestamp(1234567890)).toStrictEqual({
      type: 'RECORD_SRP_REVEAL_TIMESTAMP',
      timestamp: 1234567890,
    });
  });
});
