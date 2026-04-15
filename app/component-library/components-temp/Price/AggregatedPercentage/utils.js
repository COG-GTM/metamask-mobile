import i18n from '../../../../../locales/i18n';
import { DECIMALS_TO_SHOW } from '../../../../components/UI/Tokens/constants';
import { formatWithThreshold } from '../../../../util/assets';
import { renderFiat } from '../../../../util/number';
import { TextColor } from '../../../components/Texts/Text';

export const getFormattedAmountChange = (
input,
currentCurrency) =>

`${input >= 0 ? '+' : ''}${renderFiat(
  input,
  currentCurrency,
  DECIMALS_TO_SHOW
)} `;

export const getPercentageTextColor = (
privacyMode,
percentageChangeCrossChains) =>
{
  let percentageTextColor;
  if (!privacyMode) {
    if (percentageChangeCrossChains === 0) {
      percentageTextColor = TextColor.Default;
    } else if (percentageChangeCrossChains > 0) {
      percentageTextColor = TextColor.Success;
    } else {
      percentageTextColor = TextColor.Error;
    }
  } else {
    percentageTextColor = TextColor.Alternative;
  }
  return percentageTextColor;
};

export const getFormattedPercentageChange = (
percentageChange,
locale) =>
{
  const isPositiveChange = percentageChange >= 0;

  const formattedPercentage = formatWithThreshold(
    Math.abs(percentageChange) / 100, // Take abs here to avoid confusing <0.01% formatting
    0.0001,
    locale,
    {
      style: 'percent',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }
  );

  const signPrefix = isPositiveChange ? '+' : '-';

  return `(${signPrefix}${formattedPercentage})`;
};

export const getFormattedValuePrice = (
amountChange,
currentCurrency) =>
{
  const isPositiveChange = amountChange >= 0;

  const formattedAmount = formatWithThreshold(
    Math.abs(amountChange),
    0.01,
    i18n.locale,
    {
      style: 'currency',
      currency: currentCurrency
    }
  );

  const signPrefix = isPositiveChange ? '+' : '-';

  return `${signPrefix}${formattedAmount}`;
};