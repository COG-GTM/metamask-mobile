import {
  TX_UNAPPROVED,
  TX_SUBMITTED,
  TX_SIGNED,
  TX_PENDING,
  TX_CONFIRMED,
  TX_CANCELLED,
  TX_APPROVED,
  TX_FAILED,
  TX_REJECTED,
  UINT256_BN_MAX_VALUE,
  UINT256_HEX_MAX_VALUE,
  EMPTY_ADDRESS,
  PREFIX_HEX_STRING,
  INTERNAL_ORIGINS,
} from './transaction';

describe('transaction constants', () => {
  describe('transaction status constants', () => {
    it('defines all transaction statuses', () => {
      expect(TX_UNAPPROVED).toBe('unapproved');
      expect(TX_SUBMITTED).toBe('submitted');
      expect(TX_SIGNED).toBe('signed');
      expect(TX_PENDING).toBe('pending');
      expect(TX_CONFIRMED).toBe('confirmed');
      expect(TX_CANCELLED).toBe('cancelled');
      expect(TX_APPROVED).toBe('approved');
      expect(TX_FAILED).toBe('failed');
      expect(TX_REJECTED).toBe('rejected');
    });
  });

  describe('UINT256 constants', () => {
    it('defines UINT256_BN_MAX_VALUE as a BN instance', () => {
      expect(UINT256_BN_MAX_VALUE).toBeDefined();
      expect(UINT256_BN_MAX_VALUE.toString(16)).toBe(UINT256_HEX_MAX_VALUE);
    });

    it('defines UINT256_HEX_MAX_VALUE as 64 hex chars of f', () => {
      expect(UINT256_HEX_MAX_VALUE).toMatch(/^f{64}$/);
    });
  });

  describe('address constants', () => {
    it('defines EMPTY_ADDRESS as the zero address', () => {
      expect(EMPTY_ADDRESS).toBe(
        '0x0000000000000000000000000000000000000000',
      );
    });

    it('defines PREFIX_HEX_STRING as 0x', () => {
      expect(PREFIX_HEX_STRING).toBe('0x');
    });
  });

  describe('INTERNAL_ORIGINS', () => {
    it('is an array', () => {
      expect(Array.isArray(INTERNAL_ORIGINS)).toBe(true);
    });

    it('has at least one entry', () => {
      expect(INTERNAL_ORIGINS.length).toBeGreaterThan(0);
    });
  });
});
