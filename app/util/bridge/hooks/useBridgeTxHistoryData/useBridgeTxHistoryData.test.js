import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { useBridgeTxHistoryData } from '../useBridgeTxHistoryData';
import { waitFor } from '@testing-library/react-native';
import {
  initialState,
  evmAccountAddress } from
'../../../../components/UI/Bridge/_mocks_/initialState';
import {

  TransactionStatus } from
'@metamask/transaction-controller';


import { StatusTypes } from '@metamask/bridge-controller';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn()
}));

describe('useBridgeTxHistoryData', () => {
  const mockChainId = '0x1';
  const mockTxId = 'test-tx-id';
  const mockTxHash = '0x123';

  it('should return undefined bridgeTxHistoryItem and null isBridgeComplete when no transaction is provided', async () => {
    const { result } = renderHookWithProvider(
      () => useBridgeTxHistoryData({}),
      {
        state: initialState
      }
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        bridgeTxHistoryItem: undefined,
        isBridgeComplete: null
      });
    });
  });

  it('should find bridge history item by EVM transaction ID', async () => {
    const tx = {
      id: mockTxId,
      status: TransactionStatus.confirmed,
      chainId: mockChainId,
      networkClientId: 'mainnet',
      time: Date.now(),
      txParams: {
        to: '0x123',
        from: '0x456',
        value: '0x0',
        data: '0x'
      }
    };

    const { result } = renderHookWithProvider(
      () => useBridgeTxHistoryData({ evmTxMeta: tx }),
      {
        state: initialState
      }
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        bridgeTxHistoryItem: {
          txMetaId: mockTxId,
          account: evmAccountAddress,
          quote: {
            requestId: 'test-request-id',
            srcChainId: 1,
            srcAsset: {
              chainId: 1,
              address: '0x123',
              decimals: 18
            },
            destChainId: 10,
            destAsset: {
              chainId: 10,
              address: '0x456',
              decimals: 18
            },
            srcTokenAmount: '1000000000000000000',
            destTokenAmount: '2000000000000000000'
          },
          status: {
            status: StatusTypes.COMPLETE,
            srcChain: {
              txHash: mockTxHash
            },
            destChain: {
              txHash: '0x456'
            }
          },
          startTime: expect.any(Number),
          estimatedProcessingTimeInSeconds: 300
        },
        isBridgeComplete: true
      });
    });
  });

  it('should find bridge history item by multi-chain transaction hash', async () => {
    const multiChainTx = {
      id: mockTxHash,
      chain: 'eip155:1',
      account: evmAccountAddress,
      status: 'confirmed',
      timestamp: Date.now(),
      type: 'send',
      from: [
      {
        address: '0x123',
        asset: {
          unit: 'ETH',
          type: 'eip155:1/slip44:60',
          amount: '1000000000000000000',
          fungible: true
        }
      }],

      to: [
      {
        address: '0x456',
        asset: {
          unit: 'ETH',
          type: 'eip155:1/slip44:60',
          amount: '1000000000000000000',
          fungible: true
        }
      }],

      fees: [
      {
        type: 'base',
        asset: {
          unit: 'ETH',
          type: 'eip155:1/slip44:60',
          amount: '21000000000000',
          fungible: true
        }
      }],

      events: [
      {
        status: 'confirmed',
        timestamp: Date.now()
      }]

    };

    const { result } = renderHookWithProvider(
      () => useBridgeTxHistoryData({ multiChainTx }),
      {
        state: initialState
      }
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        bridgeTxHistoryItem: {
          txMetaId: mockTxId,
          account: evmAccountAddress,
          quote: {
            requestId: 'test-request-id',
            srcChainId: 1,
            srcAsset: {
              chainId: 1,
              address: '0x123',
              decimals: 18
            },
            destChainId: 10,
            destAsset: {
              chainId: 10,
              address: '0x456',
              decimals: 18
            },
            srcTokenAmount: '1000000000000000000',
            destTokenAmount: '2000000000000000000'
          },
          status: {
            status: StatusTypes.COMPLETE,
            srcChain: {
              txHash: mockTxHash
            },
            destChain: {
              txHash: '0x456'
            }
          },
          startTime: expect.any(Number),
          estimatedProcessingTimeInSeconds: 300
        },
        isBridgeComplete: true
      });
    });
  });

  it('should return undefined bridgeTxHistoryItem and null isBridgeComplete when no matching bridge history item is found', async () => {
    const tx = {
      id: 'non-existent-tx-id',
      status: TransactionStatus.confirmed,
      chainId: mockChainId,
      networkClientId: 'mainnet',
      time: Date.now(),
      txParams: {
        to: '0x123',
        from: '0x456',
        value: '0x0',
        data: '0x'
      }
    };

    const { result } = renderHookWithProvider(
      () => useBridgeTxHistoryData({ evmTxMeta: tx }),
      {
        state: initialState
      }
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        bridgeTxHistoryItem: undefined,
        isBridgeComplete: null
      });
    });
  });
});