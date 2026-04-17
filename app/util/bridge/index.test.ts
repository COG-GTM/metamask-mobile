import { serializeQuoteMetadata } from './index';

describe('serializeQuoteMetadata', () => {
  const mockQuoteResponse = {
    quote: { bridgeId: 'test', srcChainId: 1, destChainId: 10 },
    sentAmount: { amount: BigInt(1000), valueInCurrency: 1.5, usd: 1.5 },
    gasFee: { amount: BigInt(100), valueInCurrency: 0.1, usd: 0.1 },
    totalNetworkFee: { amount: BigInt(200), valueInCurrency: 0.2, usd: 0.2 },
    totalMaxNetworkFee: { amount: BigInt(300), valueInCurrency: 0.3, usd: 0.3 },
    toTokenAmount: { amount: BigInt(900), valueInCurrency: 1.3, usd: 1.3 },
    adjustedReturn: { valueInCurrency: 1.0, usd: 1.0 },
    swapRate: BigInt(95),
    cost: { valueInCurrency: 0.5, usd: 0.5 },
  };

  it('serializes BigInt amounts to strings', () => {
    const result = serializeQuoteMetadata(mockQuoteResponse as any);
    expect(result.sentAmount.amount).toBe('1000');
    expect(result.gasFee.amount).toBe('100');
    expect(result.totalNetworkFee.amount).toBe('200');
    expect(result.totalMaxNetworkFee.amount).toBe('300');
    expect(result.toTokenAmount.amount).toBe('900');
    expect(result.swapRate).toBe('95');
  });

  it('serializes valueInCurrency to strings', () => {
    const result = serializeQuoteMetadata(mockQuoteResponse as any);
    expect(result.sentAmount.valueInCurrency).toBe('1.5');
    expect(result.gasFee.valueInCurrency).toBe('0.1');
  });

  it('handles null valueInCurrency', () => {
    const response = {
      ...mockQuoteResponse,
      sentAmount: { amount: BigInt(1000), valueInCurrency: null, usd: null },
      gasFee: { amount: BigInt(100), valueInCurrency: null, usd: null },
      totalNetworkFee: { amount: BigInt(200), valueInCurrency: null, usd: null },
      totalMaxNetworkFee: { amount: BigInt(300), valueInCurrency: null, usd: null },
      toTokenAmount: { amount: BigInt(900), valueInCurrency: null, usd: null },
      adjustedReturn: { valueInCurrency: null, usd: null },
      cost: { valueInCurrency: null, usd: null },
    };
    const result = serializeQuoteMetadata(response as any);
    expect(result.sentAmount.valueInCurrency).toBeNull();
    expect(result.sentAmount.usd).toBeNull();
  });

  it('preserves non-metadata fields', () => {
    const result = serializeQuoteMetadata(mockQuoteResponse as any);
    expect(result.quote).toEqual(mockQuoteResponse.quote);
  });
});
