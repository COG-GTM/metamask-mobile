import { selectBridgeStatusState, selectBridgeHistoryForAccount } from '.';

jest.mock('../accountsController', () => ({
  selectSelectedInternalAccountAddress: (state: any) => state.__testSelectedAddress || '0xUser1',
}));

describe('BridgeStatusController Selectors', () => {
  const mockState = {
    __testSelectedAddress: '0xUser1',
    engine: {
      backgroundState: {
        BridgeStatusController: {
          txHistory: {
            'tx-1': { account: '0xUser1', status: 'complete' },
            'tx-2': { account: '0xUser2', status: 'pending' },
            'tx-3': { account: '0xUser1', status: 'pending' },
          },
        },
      },
    },
  } as any;

  it('selectBridgeStatusState should return controller state', () => {
    const result = selectBridgeStatusState(mockState);
    expect(result.txHistory).toBeDefined();
  });

  it('selectBridgeHistoryForAccount should filter by selected address', () => {
    const result = selectBridgeHistoryForAccount(mockState);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['tx-1'].account).toBe('0xUser1');
    expect(result['tx-3'].account).toBe('0xUser1');
  });

  it('should handle undefined bridge status state', () => {
    const emptyState = {
      __testSelectedAddress: '0xUser1',
      engine: {
        backgroundState: {
          BridgeStatusController: undefined,
        },
      },
    } as any;
    const result = selectBridgeHistoryForAccount(emptyState);
    expect(result).toStrictEqual({});
  });
});
