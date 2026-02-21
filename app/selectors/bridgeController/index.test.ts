import { selectBridgeControllerState, selectQuoteRequest } from './';
import { RootState } from '../../reducers';

describe('bridgeController selectors', () => {
  const mockBridgeControllerState = {
    quoteRequest: {
      srcChainId: 1,
      destChainId: 10,
      srcTokenAddress: '0xabc',
      destTokenAddress: '0xdef',
    },
    quotes: [],
    quotesLastFetched: null,
  };

  const mockState = {
    engine: {
      backgroundState: {
        BridgeController: mockBridgeControllerState,
      },
    },
  } as unknown as RootState;

  describe('selectBridgeControllerState', () => {
    it('should return the BridgeController state', () => {
      expect(selectBridgeControllerState(mockState)).toBe(
        mockBridgeControllerState,
      );
    });
  });

  describe('selectQuoteRequest', () => {
    it('should return the quoteRequest from BridgeController state', () => {
      const result = selectQuoteRequest(mockState);
      expect(result).toEqual(mockBridgeControllerState.quoteRequest);
    });
  });
});
