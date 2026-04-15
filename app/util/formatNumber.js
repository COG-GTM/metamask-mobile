import BigNumber from 'bignumber.js';

const formatNumber = (value) =>
new BigNumber(value).toFormat();

export default formatNumber;