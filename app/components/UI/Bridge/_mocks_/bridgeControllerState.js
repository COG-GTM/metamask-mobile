

export const mockChainId = '0x1';

// Ethereum tokens
export const ethToken1Address =
'0x0000000000000000000000000000000000000001';
export const ethToken2Address =
'0x0000000000000000000000000000000000000002';

// Optimism tokens
export const optimismToken1Address =
'0x0000000000000000000000000000000000000003';

export const defaultBridgeControllerState = {
  quoteRequest: {},
  quotes: [],
  quotesInitialLoadTime: null,
  quotesLastFetched: null,
  quotesLoadingStatus: null,
  quoteFetchError: null,
  quotesRefreshCount: 0
};