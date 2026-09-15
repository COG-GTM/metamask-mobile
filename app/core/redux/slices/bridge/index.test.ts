import reducer, {
  initialState,
  setSourceAmount,
  setDestAmount,
  resetBridgeState,
  setSlippage,
  selectBridgeQuotes,
} from '.';
import { BridgeToken } from '../../../../components/UI/Bridge/types';
import { Hex } from '@metamask/utils';
import { initialState as bridgeMockState } from '../../../../components/UI/Bridge/_mocks_/initialState';
import { RootState } from '../../../../reducers';

describe('bridge slice', () => {
  const mockToken: BridgeToken = {
    address: '0x123',
    symbol: 'ETH',
    decimals: 18,
    image: 'https://example.com/eth.png',
    chainId: '0x1' as Hex,
    name: 'Ethereum',
    balance: '100',
    balanceFiat: '100',
  };

  const mockDestToken: BridgeToken = {
    address: '0x456',
    symbol: 'USDC',
    decimals: 6,
    image: 'https://example.com/usdc.png',
    chainId: '0x2' as Hex,
    name: 'USDC',
    balance: '100',
    balanceFiat: '100',
  };

  describe('initial state', () => {
    it('should have the correct initial state', () => {
      expect(initialState).toEqual({
        sourceAmount: undefined,
        destAmount: undefined,
        destChainId: undefined,
        sourceToken: undefined,
        destToken: undefined,
        slippage: '0.5',
        isSubmittingTx: false,
      });
    });
  });

  describe('setSourceAmount', () => {
    it('should set the source amount', () => {
      const amount = '1.5';
      const action = setSourceAmount(amount);
      const state = reducer(initialState, action);

      expect(state.sourceAmount).toBe(amount);
    });

    it('should set source amount to undefined', () => {
      const action = setSourceAmount(undefined);
      const state = reducer(initialState, action);

      expect(state.sourceAmount).toBeUndefined();
    });
  });

  describe('setSlippage', () => {
    it('should set the slippage', () => {
      const slippage = '0.5';
      const action = setSlippage(slippage);
      const state = reducer(initialState, action);

      expect(state.slippage).toBe(slippage);
    });
  });

  describe('setDestAmount', () => {
    it('should set the destination amount', () => {
      const amount = '100';
      const action = setDestAmount(amount);
      const state = reducer(initialState, action);

      expect(state.destAmount).toBe(amount);
    });

    it('should set dest amount to undefined', () => {
      const action = setDestAmount(undefined);
      const state = reducer(initialState, action);

      expect(state.destAmount).toBeUndefined();
    });
  });

  describe('resetBridgeState', () => {
    it('should reset the state to initial state', () => {
      const state = {
        ...initialState,
        sourceAmount: '1.5',
        destAmount: '100',
        sourceToken: mockToken,
        destToken: mockDestToken,
      };

      const action = resetBridgeState();
      const newState = reducer(state, action);

      expect(newState).toEqual(initialState);
    });
  });

  describe('selectBridgeQuotes', () => {
    const mockState = bridgeMockState as unknown as RootState;

    it('returns the same reference when controller inputs are unchanged', () => {
      const first = selectBridgeQuotes(mockState);
      const second = selectBridgeQuotes(mockState);

      expect(second).toBe(first);
    });

    it('returns the same reference when an unrelated slice of state changes', () => {
      const first = selectBridgeQuotes(mockState);
      const unrelatedChange = {
        ...mockState,
        bridge: { ...mockState.bridge, sourceAmount: '999' },
      } as RootState;
      const second = selectBridgeQuotes(unrelatedChange);

      expect(second).toBe(first);
    });

    it('recomputes when the BridgeController state changes', () => {
      const first = selectBridgeQuotes(mockState);
      const changedState = {
        ...mockState,
        engine: {
          ...mockState.engine,
          backgroundState: {
            ...mockState.engine.backgroundState,
            BridgeController: {
              ...mockState.engine.backgroundState.BridgeController,
              quotesLastFetched: 123,
            },
          },
        },
      } as unknown as RootState;
      const second = selectBridgeQuotes(changedState);

      expect(second).not.toBe(first);
      expect(second.quotesLastFetchedMs).toBe(123);
    });
  });
});
