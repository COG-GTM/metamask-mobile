import BigNumber from 'bignumber';

const formatNumber = (value: number | string) =>
  new BigNumber(value).toFormat();

export default formatNumber;
