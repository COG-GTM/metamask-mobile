import {
  createInternalSwapsActionId,
  isInternalOrigin,
  isInternalSwapsTransaction,
} from './internal-origins';

describe('internal-origins', () => {
  describe('isInternalOrigin', () => {
    it.each([process.env.MM_FOX_CODE, 'MetaMask Mobile', 'metamask'])(
      'returns true for internal origin %s',
      (origin) => {
        expect(isInternalOrigin(origin)).toBe(true);
      },
    );

    it.each(['example.metamask.io', '', undefined, null])(
      'returns false for %s',
      (origin) => {
        expect(isInternalOrigin(origin)).toBe(false);
      },
    );
  });

  describe('isInternalSwapsTransaction', () => {
    it('returns true for an action ID issued to the Swaps flow', () => {
      const actionId = createInternalSwapsActionId();
      expect(
        isInternalSwapsTransaction(process.env.MM_FOX_CODE, actionId),
      ).toBe(true);
    });

    it('returns false when the Swaps origin is used without an issued action ID', () => {
      expect(isInternalSwapsTransaction(process.env.MM_FOX_CODE)).toBe(false);
      expect(
        isInternalSwapsTransaction(
          process.env.MM_FOX_CODE,
          'mm-swaps-00000000-0000-0000-0000-000000000000',
        ),
      ).toBe(false);
    });

    it('returns false for a non-Swaps origin with an issued action ID', () => {
      const actionId = createInternalSwapsActionId();
      expect(isInternalSwapsTransaction('example.metamask.io', actionId)).toBe(
        false,
      );
    });

    it('issues unique action IDs', () => {
      expect(createInternalSwapsActionId()).not.toBe(
        createInternalSwapsActionId(),
      );
    });
  });
});
