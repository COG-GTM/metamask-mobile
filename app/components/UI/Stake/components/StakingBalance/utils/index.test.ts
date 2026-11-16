import { ExitRequestWithClaimedAssetInfo } from '../StakingBalance.types';
import { filterExitRequests, isExitRequestClaimable } from '.';

const createExitRequest = (
  overrides: Partial<ExitRequestWithClaimedAssetInfo> = {},
): ExitRequestWithClaimedAssetInfo => ({
  positionTicket: '1000',
  timestamp: '1727110415000',
  totalShares: '1000000000000000000',
  withdrawalTimestamp: null,
  exitQueueIndex: '57',
  claimedAssets: null,
  leftShares: null,
  ...overrides,
});

describe('StakingBalance utils', () => {
  describe('isExitRequestClaimable', () => {
    it.each`
      exitQueueIndex | leftShares | expected
      ${'-1'}        | ${'0'}     | ${false}
      ${'-1'}        | ${'1'}     | ${false}
      ${'-1'}        | ${null}    | ${false}
      ${'0'}         | ${'0'}     | ${true}
      ${'57'}        | ${'0'}     | ${true}
      ${'57'}        | ${'1'}     | ${true}
      ${'57'}        | ${'2'}     | ${false}
      ${'57'}        | ${'10'}    | ${false}
      ${'57'}        | ${null}    | ${false}
    `(
      'returns $expected for exitQueueIndex $exitQueueIndex and leftShares $leftShares',
      ({ exitQueueIndex, leftShares, expected }) => {
        expect(
          isExitRequestClaimable(
            createExitRequest({ exitQueueIndex, leftShares }),
          ),
        ).toBe(expected);
      },
    );
  });

  describe('filterExitRequests', () => {
    it('returns empty lists for no exit requests', () => {
      expect(filterExitRequests([], '1.5')).toEqual({
        unstakingRequests: [],
        claimableRequests: [],
      });
    });

    it('splits a mixed list into claimable and unstaking requests in order', () => {
      const notInQueue = createExitRequest({
        positionTicket: '1',
        exitQueueIndex: '-1',
        leftShares: '0',
      });
      const fullyExited = createExitRequest({
        positionTicket: '2',
        leftShares: '0',
        claimedAssets: '1500000000000000000',
      });
      const roundingRemainder = createExitRequest({
        positionTicket: '3',
        leftShares: '1',
        claimedAssets: '1499999999999999999',
      });
      const pending = createExitRequest({ positionTicket: '4' });
      const partial = createExitRequest({
        positionTicket: '5',
        leftShares: '400000000000000000',
        claimedAssets: '600000000000000000',
      });

      const { claimableRequests, unstakingRequests } = filterExitRequests(
        [notInQueue, fullyExited, roundingRemainder, pending, partial],
        '1.5',
      );

      expect(claimableRequests).toEqual([fullyExited, roundingRemainder]);
      expect(claimableRequests[0]).not.toHaveProperty('assetsToDisplay');
      expect(
        unstakingRequests.map(({ positionTicket }) => positionTicket),
      ).toEqual(['1', '4', '5']);
    });

    it('values an unclaimed request as totalShares * exchangeRate', () => {
      const request = createExitRequest({
        totalShares: '1000000000000000000',
      });

      const { unstakingRequests } = filterExitRequests([request], '1.5');

      expect(unstakingRequests).toEqual([
        { ...request, assetsToDisplay: '1500000000000000000' },
      ]);
    });

    it('values a partially withdrawn request as leftShares * exchangeRate + claimedAssets', () => {
      const request = createExitRequest({
        totalShares: '1000000000000000000',
        leftShares: '400000000000000000',
        claimedAssets: '600000000000000000',
      });

      const { unstakingRequests } = filterExitRequests([request], '1.5');

      // (leftShares + claimedAssets) * rate would be 1500000000000000000
      // and ignoring claimedAssets would be 600000000000000000
      expect(unstakingRequests[0].assetsToDisplay).toBe('1200000000000000000');
    });

    it('treats leftShares above the rounding threshold as still unstaking', () => {
      const request = createExitRequest({
        leftShares: '2',
        claimedAssets: '1000',
      });

      const { claimableRequests, unstakingRequests } = filterExitRequests(
        [request],
        '1.5',
      );

      expect(claimableRequests).toEqual([]);
      expect(unstakingRequests[0].assetsToDisplay).toBe('1003');
    });

    it('uses only claimedAssets when leftShares is null', () => {
      const request = createExitRequest({
        leftShares: null,
        claimedAssets: '600000000000000000',
      });

      const { unstakingRequests } = filterExitRequests([request], '1.5');

      expect(unstakingRequests[0].assetsToDisplay).toBe('600000000000000000');
    });

    it('multiplies by a fractional exchangeRate without floating point error', () => {
      const unclaimed = createExitRequest({
        positionTicket: '1',
        totalShares: '3',
      });
      const partial = createExitRequest({
        positionTicket: '2',
        leftShares: '7',
        claimedAssets: '0.1',
      });

      const { unstakingRequests } = filterExitRequests(
        [unclaimed, partial],
        '1.000123456789',
      );

      expect(unstakingRequests.map((r) => r.assetsToDisplay)).toEqual([
        '3.000370370367',
        '7.100864197523',
      ]);
    });

    it('does not mutate the input requests', () => {
      const request = createExitRequest();
      const snapshot = { ...request };

      filterExitRequests([request], '1.5');

      expect(request).toEqual(snapshot);
      expect(request).not.toHaveProperty('assetsToDisplay');
    });
  });
});
