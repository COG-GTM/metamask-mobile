





































const TIME_PERIOD_TO_MARKET_DATA_KEY =


{
  '1d': 'P1D',
  '1w': 'P7D',
  '7d': 'P7D',
  '1m': 'P30D',
  '3m': 'P200D',
  '1y': 'P1Y',
  '3y': 'P1Y' // TODO: Add 3y market data key
};

export const calculateAssetPrice = ({
  isEvmNetworkSelected,
  exchangeRate,
  tickerConversionRate,
  prices,
  multichainAssetRates,
  timePeriod
}) => {
  let currentPrice = 0;
  let priceDiff = 0;
  const comparePrice = prices[0]?.[1] || 0;
  let pricePercentChange;

  if (isEvmNetworkSelected) {
    // EVM price calculation
    currentPrice =
    exchangeRate && tickerConversionRate ?
    exchangeRate * tickerConversionRate :
    0;

    if (currentPrice !== undefined && currentPrice !== null) {
      priceDiff = currentPrice - comparePrice;
    }
  } else if (multichainAssetRates?.rate) {
    // Non-EVM price calculation
    currentPrice = multichainAssetRates.rate;
    priceDiff = currentPrice - comparePrice;

    // Get price percent change from market data
    const marketDataKey = TIME_PERIOD_TO_MARKET_DATA_KEY[timePeriod];
    pricePercentChange =
    multichainAssetRates.marketData?.pricePercentChange?.[marketDataKey];
  }

  return {
    currentPrice,
    priceDiff,
    comparePrice,
    pricePercentChange
  };
};