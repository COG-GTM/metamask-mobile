import { ChainId } from '@metamask/stake-sdk';
import {
  generateClaimTxParams,
  have24HoursPassed,
  isRequestClaimable,
  transformAggregatedClaimableExitRequestToMulticallArgs,
} from './utils';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FIXED_NOW_MS = 10 * TWENTY_FOUR_HOURS_MS;
const TWO_DAYS_AGO_MS = FIXED_NOW_MS - 2 * TWENTY_FOUR_HOURS_MS;
const RECENT_MS = FIXED_NOW_MS - 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW_MS);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('have24HoursPassed', () => {
  it('returns true when the timestamp is more than 24 hours in the past', () => {
    expect(have24HoursPassed(String(TWO_DAYS_AGO_MS))).toBe(true);
  });

  it('returns false when the timestamp is within the last hour', () => {
    expect(have24HoursPassed(String(RECENT_MS))).toBe(false);
  });
});

describe('isRequestClaimable', () => {
  it('returns false when the exit queue index is the pending sentinel "-1"', () => {
    expect(isRequestClaimable('-1', String(TWO_DAYS_AGO_MS))).toBe(false);
  });

  it('returns a falsy value when the exit queue index is empty', () => {
    expect(isRequestClaimable('', String(TWO_DAYS_AGO_MS))).toBeFalsy();
  });

  it('returns true when the exit queue index is valid and 24 hours have passed', () => {
    expect(isRequestClaimable('1', String(TWO_DAYS_AGO_MS))).toBe(true);
  });

  it('returns false when 24 hours have not passed even with a valid queue index', () => {
    expect(isRequestClaimable('1', String(RECENT_MS))).toBe(false);
  });
});

describe('transformAggregatedClaimableExitRequestToMulticallArgs', () => {
  it('returns an empty list when no requests are claimable', () => {
    const result = transformAggregatedClaimableExitRequestToMulticallArgs([
      { positionTicket: '1', timestamp: String(RECENT_MS), exitQueueIndex: '1' },
      { positionTicket: '2', timestamp: String(TWO_DAYS_AGO_MS), exitQueueIndex: '-1' },
    ]);

    expect(result).toEqual([]);
  });

  it('converts timestamps from milliseconds to seconds and pushes a claim per claimable request', () => {
    const result = transformAggregatedClaimableExitRequestToMulticallArgs([
      {
        positionTicket: '42',
        timestamp: String(TWO_DAYS_AGO_MS),
        exitQueueIndex: '7',
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      functionName: 'claimExitedAssets',
      args: ['42', String(Math.trunc(TWO_DAYS_AGO_MS / 1000)), '7'],
    });
  });

  it('skips non-claimable requests while keeping claimable ones', () => {
    const result = transformAggregatedClaimableExitRequestToMulticallArgs([
      { positionTicket: '1', timestamp: String(TWO_DAYS_AGO_MS), exitQueueIndex: '1' },
      { positionTicket: '2', timestamp: String(RECENT_MS), exitQueueIndex: '2' },
      { positionTicket: '3', timestamp: String(TWO_DAYS_AGO_MS), exitQueueIndex: '-1' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].args[0]).toBe('1');
  });
});

describe('generateClaimTxParams', () => {
  it('builds transaction params with a hex chain id and a hex-encoded gas limit', () => {
    const txParams = generateClaimTxParams(
      '0xActiveAccount',
      '0xContract',
      '0xdata',
      ChainId.ETHEREUM,
      '200000',
    );

    expect(txParams).toEqual({
      to: '0xContract',
      from: '0xActiveAccount',
      chainId: `0x${ChainId.ETHEREUM}`,
      data: '0xdata',
      value: '0',
      gas: expect.stringMatching(/^0x[0-9a-f]+$/i),
    });
  });
});
