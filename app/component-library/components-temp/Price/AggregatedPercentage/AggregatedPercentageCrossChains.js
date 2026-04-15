import React, { useMemo } from 'react';
import { TextVariant } from '../../../../component-library/components/Texts/Text';
import SensitiveText from '../../../../component-library/components/Texts/SensitiveText';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentCurrency } from '../../../../selectors/currencyRateController';
import styleSheet from './AggregatedPercentage.styles';
import { useStyles } from '../../../hooks';
import {
  FORMATTED_VALUE_PRICE_TEST_ID,
  FORMATTED_PERCENTAGE_TEST_ID } from
'./AggregatedPercentage.constants';
import { toChecksumAddress, zeroAddress } from 'ethereumjs-util';
import { selectTokenMarketData } from '../../../../selectors/tokenRatesController';




import { getFormattedAmountChange, getPercentageTextColor } from './utils';


export const getCalculatedTokenAmount1dAgo = (
tokenFiatBalance,
tokenPricePercentChange1dAgo) =>

tokenPricePercentChange1dAgo !== undefined && tokenFiatBalance ?
tokenFiatBalance / (1 + tokenPricePercentChange1dAgo / 100) :
tokenFiatBalance ?? 0;

const isValidAmount = (amount) =>
amount !== null && amount !== undefined && !Number.isNaN(amount);

const AggregatedPercentageCrossChains = ({
  privacyMode = false,
  totalFiatCrossChains,
  tokenFiatBalancesCrossChains
}) => {
  const crossChainMarketData = useSelector(
    selectTokenMarketData
  );

  const totalFiat1dAgoCrossChains = useMemo(() => {
    const getPerChainTotalFiat1dAgo = (
    chainId,
    tokenFiatBalances,
    tokensWithBalances) =>
    {
      const totalPerChain1dAgoERC20 = tokensWithBalances.reduce(
        (total1dAgo, item, idx) => {
          const found =
          crossChainMarketData?.[chainId]?.[toChecksumAddress(item.address)];

          const tokenFiat1dAgo = getCalculatedTokenAmount1dAgo(
            tokenFiatBalances[idx],
            found?.pricePercentChange1d
          );
          return total1dAgo + Number(tokenFiat1dAgo);
        },
        0
      );

      return totalPerChain1dAgoERC20;
    };
    return tokenFiatBalancesCrossChains.reduce(
      (
      total1dAgoCrossChains,
      item) =>





      {
        const perChainERC20Total = getPerChainTotalFiat1dAgo(
          item.chainId,
          item.tokenFiatBalances,
          item.tokensWithBalances
        );

        const nativePricePercentChange1d =
        crossChainMarketData?.[item.chainId]?.[zeroAddress()]?.
        pricePercentChange1d;

        const nativeFiat1dAgo = getCalculatedTokenAmount1dAgo(
          item.nativeFiatValue,
          nativePricePercentChange1d
        );
        return (
          total1dAgoCrossChains + perChainERC20Total + Number(nativeFiat1dAgo));

      },
      0
    );
  }, [tokenFiatBalancesCrossChains, crossChainMarketData]);

  const totalCrossChainBalance = Number(totalFiatCrossChains);
  const crossChainTotalBalance1dAgo = totalFiat1dAgoCrossChains;

  const amountChangeCrossChains =
  totalCrossChainBalance - crossChainTotalBalance1dAgo;

  const percentageChangeCrossChains =
  amountChangeCrossChains / crossChainTotalBalance1dAgo * 100 || 0;

  const validFormattedPercentChange = `(${
  percentageChangeCrossChains >= 0 ? '+' : ''}${
  percentageChangeCrossChains.toFixed(2)}%)`;

  const formattedPercentChangeCrossChains = isValidAmount(
    percentageChangeCrossChains
  ) ?
  validFormattedPercentChange :
  '';
  const currentCurrency = useSelector(selectCurrentCurrency);

  const validFormattedAmountChange = getFormattedAmountChange(
    amountChangeCrossChains,
    currentCurrency
  );
  const formattedAmountChangeCrossChains = isValidAmount(
    amountChangeCrossChains
  ) ?
  validFormattedAmountChange :
  '';

  const percentageTextColor = getPercentageTextColor(
    privacyMode,
    percentageChangeCrossChains
  );
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={styles.wrapper}>
      <SensitiveText
        isHidden={privacyMode}
        length="10"
        color={percentageTextColor}
        variant={TextVariant.BodyMDMedium}
        testID={FORMATTED_VALUE_PRICE_TEST_ID}>
        
        {formattedAmountChangeCrossChains}
      </SensitiveText>
      <SensitiveText
        isHidden={privacyMode}
        length="10"
        color={percentageTextColor}
        variant={TextVariant.BodyMDMedium}
        testID={FORMATTED_PERCENTAGE_TEST_ID}>
        
        {formattedPercentChangeCrossChains}
      </SensitiveText>
    </View>);

};

export default AggregatedPercentageCrossChains;