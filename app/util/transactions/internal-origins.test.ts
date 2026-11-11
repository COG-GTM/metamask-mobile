import TransactionTypes from '../../core/TransactionTypes';
import {
  MAX_SWAPS_ACTION_IDS,
  createSwapsActionId,
  hasInternalOriginatorInfo,
  isInternalOrigin,
  isSwapsFlowTransaction,
  isZeroTransactionValue,
} from './internal-origins';

const FOX_CODE = process.env.MM_FOX_CODE as string;

describe('internal-origins', () => {
  describe('isInternalOrigin', () => {
    it.each([FOX_CODE, TransactionTypes.MMM, 'metamask'])(
      'returns true for internal origin %s',
      (origin) => {
        expect(isInternalOrigin(origin)).toBe(true);
      },
    );

    it.each([undefined, null, '', 'app.uniswap.org', 'https://example.com', 1])(
      'returns false for %s',
      (origin) => {
        expect(isInternalOrigin(origin)).toBe(false);
      },
    );
  });

  describe('hasInternalOriginatorInfo', () => {
    it('detects an internal origin in url or title', () => {
      expect(hasInternalOriginatorInfo({ url: FOX_CODE })).toBe(true);
      expect(
        hasInternalOriginatorInfo({ url: 'https://dapp.io', title: FOX_CODE }),
      ).toBe(true);
    });

    it('returns false for regular dapp metadata', () => {
      expect(
        hasInternalOriginatorInfo({ url: 'https://dapp.io', title: 'Dapp' }),
      ).toBe(false);
      expect(hasInternalOriginatorInfo(undefined)).toBe(false);
    });
  });

  describe('isSwapsFlowTransaction', () => {
    it('returns true only for the Swaps origin with an issued action ID', () => {
      const actionId = createSwapsActionId();
      expect(isSwapsFlowTransaction(FOX_CODE, actionId)).toBe(true);
    });

    it('returns false for the Swaps origin without an action ID', () => {
      expect(isSwapsFlowTransaction(FOX_CODE, undefined)).toBe(false);
    });

    it('returns false for a forged action ID', () => {
      expect(isSwapsFlowTransaction(FOX_CODE, 'mm-swaps-forged')).toBe(false);
    });

    it('returns false for an issued action ID with another origin', () => {
      const actionId = createSwapsActionId();
      expect(isSwapsFlowTransaction('app.uniswap.org', actionId)).toBe(false);
    });

    it('keeps only the most recent action IDs', () => {
      const oldest = createSwapsActionId();
      for (let i = 0; i < MAX_SWAPS_ACTION_IDS; i++) {
        createSwapsActionId();
      }
      const newest = createSwapsActionId();
      expect(isSwapsFlowTransaction(FOX_CODE, oldest)).toBe(false);
      expect(isSwapsFlowTransaction(FOX_CODE, newest)).toBe(true);
    });
  });

  describe('isZeroTransactionValue', () => {
    it.each([undefined, '', '0x', '0x0', '0x00', '0'])(
      'returns true for %s',
      (value) => {
        expect(isZeroTransactionValue(value)).toBe(true);
      },
    );

    it.each(['0x1', '0xde0b6b3a7640000'])('returns false for %s', (value) => {
      expect(isZeroTransactionValue(value)).toBe(false);
    });
  });
});
