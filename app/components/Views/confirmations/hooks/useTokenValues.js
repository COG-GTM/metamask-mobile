import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';


import { useTransactionMetadataRequest } from './transactions/useTransactionMetadataRequest';
import { selectConversionRateByChainId } from '../../../../selectors/currencyRateController';
import I18n from '../../../../../locales/i18n';
import { formatAmount } from '../../../../components/UI/SimulationDetails/formatAmount';
import { fromWei, hexToBN, toBigNumber } from '../../../../util/number';
import useFiatFormatter from '../../../UI/SimulationDetails/FiatDisplay/useFiatFormatter';


// TODO: This hook will be extended to calculate token and fiat information from transaction metadata on upcoming redesigned confirmations
export const useTokenValues = ({ amountWei } = {}) => {

  const transactionMetadata = useTransactionMetadataRequest();

  let ethAmountInWei;
  if (amountWei) {
    ethAmountInWei = toBigNumber.dec(amountWei);
  } else {
    ethAmountInWei = hexToBN(transactionMetadata?.txParams?.value);
  }

  const ethAmountInBN = new BigNumber(fromWei(ethAmountInWei, 'ether'));

  const tokenAmountValue = ethAmountInBN.toFixed();

  const locale = I18n.locale;
  const tokenAmountDisplayValue = formatAmount(locale, ethAmountInBN);

  const fiatFormatter = useFiatFormatter();
  const nativeConversionRate = useSelector((state) =>
  selectConversionRateByChainId(state, transactionMetadata?.chainId)
  );
  const nativeConversionRateInBN = new BigNumber(nativeConversionRate || 1);
  const preciseFiatValue = ethAmountInBN.times(nativeConversionRateInBN);
  const fiatDisplayValue = preciseFiatValue && fiatFormatter(preciseFiatValue);

  return {
    tokenAmountValue,
    tokenAmountDisplayValue,
    fiatDisplayValue
  };
};