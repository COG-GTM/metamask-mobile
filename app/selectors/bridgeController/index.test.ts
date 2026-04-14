import { selectBridgeControllerState, selectQuoteRequest } from '.';

describe('BridgeController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        BridgeController: {
          quoteRequest: { srcChainId: '0x1', destChainId: '0xa' },
        },
      },
    },
  } as any;

  it('selectBridgeControllerState should return controller state', () => {
    const result = selectBridgeControllerState(mockState);
    expect(result.quoteRequest).toBeDefined();
  });

  it('selectQuoteRequest should return quote request', () => {
    const result = selectQuoteRequest(mockState);
    expect(result).toStrictEqual({ srcChainId: '0x1', destChainId: '0xa' });
  });
});
