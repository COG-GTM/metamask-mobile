import BigNumber from 'bignumber.js';

export let BigNumberUtilsReturnFormat = /*#__PURE__*/function (BigNumberUtilsReturnFormat) {BigNumberUtilsReturnFormat["NUMBER"] = "NUMBER";BigNumberUtilsReturnFormat["BN"] = "BN";BigNumberUtilsReturnFormat["STRING"] = "STRING";return BigNumberUtilsReturnFormat;}({});







export const bnZero = new BigNumber(0);
export const bnOne = new BigNumber(1);
export const bnTen = new BigNumber(10);

export const getPowerOfTen = (pow) => bnTen.pow(pow);

export const getValueAsBn = (value) =>
typeof value === 'string' || typeof value === 'number' ?
new BigNumber(value) :
value;

export const multiplyValueByPowerOfTen = (
value,
pow) =>
{
  const valueAsBn = getValueAsBn(value);
  const power = getPowerOfTen(pow);

  let override;
  // 0 * Number.POSITIVE_INFINITY is NaN, but this is a weird outcome so let's say it equals 0
  if (valueAsBn.eq(0) && power.eq(Number.POSITIVE_INFINITY)) override = bnZero;
  if (valueAsBn.eq(Number.POSITIVE_INFINITY) && power.eq(0)) override = bnZero;
  if (valueAsBn.eq(Number.NEGATIVE_INFINITY) && power.eq(0)) override = bnZero;

  const calculated = override || valueAsBn.multipliedBy(power);
  return calculated;
};