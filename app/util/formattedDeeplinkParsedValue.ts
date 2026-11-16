import BigNumber from 'bignumber.js';

const formattedDeeplinkParsedValue = (value: string) =>
  new BigNumber(value, 10).toFixed();

export default formattedDeeplinkParsedValue;
