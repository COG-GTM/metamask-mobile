import { approveHost, rejectHost, recordSRPRevealTimestamp } from './';

describe('Privacy Actions', () => {
  describe('approveHost', () => {
    it('returns APPROVE_HOST action', () => {
      expect(approveHost('example.com')).toEqual({
        type: 'APPROVE_HOST',
        hostname: 'example.com',
      });
    });
  });

  describe('rejectHost', () => {
    it('returns REJECT_HOST action', () => {
      expect(rejectHost('example.com')).toEqual({
        type: 'REJECT_HOST',
        hostname: 'example.com',
      });
    });
  });

  describe('recordSRPRevealTimestamp', () => {
    it('returns RECORD_SRP_REVEAL_TIMESTAMP action', () => {
      expect(recordSRPRevealTimestamp(1234567890)).toEqual({
        type: 'RECORD_SRP_REVEAL_TIMESTAMP',
        timestamp: 1234567890,
      });
    });
  });
});
