






import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import i18n from '../../../../../locales/i18n';
import { useStyles } from '../../../../component-library/hooks';
import styleSheet from './TokenDetails.styles';
import { safeToChecksumAddress } from '../../../../util/address';
import {
  selectConversionRateBySymbol,
  selectCurrentCurrency } from
'../../../../selectors/currencyRateController';
import { selectNativeCurrencyByChainId } from '../../../../selectors/networkController';
import Logger from '../../../../util/Logger';
import TokenDetailsList from './TokenDetailsList';
import MarketDetailsList from './MarketDetailsList';

import StakingEarnings from '../../Stake/components/StakingEarnings';
import {
  isAssetFromSearch,
  selectTokenDisplayData } from
'../../../../selectors/tokenSearchDiscoveryDataController';
import { isSupportedLendingTokenByChainId } from '../../Earn/utils/token';
import EarnEmptyStateCta from '../../Earn/components/EmptyStateCta';
import { parseFloatSafe } from '../../Earn/utils';
import { selectStablecoinLendingEnabledFlag } from '../../Earn/selectors/featureFlags';
import { selectIsEvmNetworkSelected } from '../../../../selectors/multichainNetworkController';
import { selectEvmTokenMarketData } from '../../../../selectors/multichain/evm';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { selectMultichainAssetsRates } from '../../../../selectors/multichain';
///: END:ONLY_INCLUDE_IF

import { formatMarketDetails } from '../utils/marketDetails';
import { getTokenDetails } from '../utils/getTokenDetails';


























const TokenDetails = ({ asset }) => {
  const { styles } = useStyles(styleSheet, {});
  const isStablecoinLendingEnabled = useSelector(
    selectStablecoinLendingEnabledFlag
  );

  const nativeCurrency = useSelector((state) =>
  selectNativeCurrencyByChainId(state, asset.chainId)
  );
  const conversionRateBySymbol = useSelector((state) =>
  selectConversionRateBySymbol(state, nativeCurrency)
  );
  const currentCurrency = useSelector(selectCurrentCurrency);

  const isEvmNetworkSelected = useSelector(selectIsEvmNetworkSelected);

  const tokenContractAddress = isEvmNetworkSelected ?
  safeToChecksumAddress(asset.address) :
  asset.address;

  const tokenSearchResult = useSelector((state) =>
  selectTokenDisplayData(state, asset.chainId, asset.address)
  );

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const allMultichainAssetsRates = useSelector(selectMultichainAssetsRates);

  const multichainAssetRates =
  allMultichainAssetsRates[asset.address];

  const nonEvmMarketData = multichainAssetRates?.marketData;
  const nonEvmMetadata = {
    rate: Number(multichainAssetRates?.rate),
    conversionTime: Number(multichainAssetRates?.conversionTime)
  };
  ///: END:ONLY_INCLUDE_IF

  const evmMarketData = useSelector((state) =>
  isEvmNetworkSelected ?
  selectEvmTokenMarketData(state, {
    chainId: asset.chainId,
    tokenAddress: asset.address
  }) :
  null
  );

  const evmConversionRate = isAssetFromSearch(asset) ?
  1 :
  conversionRateBySymbol;

  const conversionRate = isEvmNetworkSelected ?
  evmConversionRate :
  nonEvmMetadata.rate;

  let marketData;
  let tokenMetadata;

  if (
  isAssetFromSearch(asset) &&
  tokenSearchResult?.found &&
  tokenSearchResult.price)
  {
    marketData = tokenSearchResult.price;
    tokenMetadata = tokenSearchResult.token;
  } else {
    tokenMetadata = isEvmNetworkSelected ? evmMarketData?.metadata : null;
    marketData = isEvmNetworkSelected ?
    evmMarketData?.marketData :
    nonEvmMarketData;
  }
  const tokenDetails = useMemo(
    () =>
    getTokenDetails(
      asset,
      isEvmNetworkSelected,
      tokenContractAddress,
      tokenMetadata
    ),
    [asset, isEvmNetworkSelected, tokenContractAddress, tokenMetadata]
  );

  const marketDetails = useMemo(() => {
    if (!marketData) return;

    if (!conversionRate || conversionRate < 0) {
      Logger.log('invalid conversion rate');
      return;
    }

    return formatMarketDetails(
      {
        marketCap: marketData.marketCap ?
        Number(marketData.marketCap) :
        undefined,
        totalVolume: marketData.totalVolume ?
        Number(marketData.totalVolume) :
        undefined,
        circulatingSupply: marketData.circulatingSupply ?
        Number(marketData.circulatingSupply) :
        undefined,
        allTimeHigh: marketData.allTimeHigh ?
        Number(marketData.allTimeHigh) :
        undefined,
        allTimeLow: marketData.allTimeLow ?
        Number(marketData.allTimeLow) :
        undefined,
        dilutedMarketCap: marketData?.dilutedMarketCap ?
        Number(marketData.dilutedMarketCap) :
        undefined
      },
      {
        locale: i18n.locale,
        currentCurrency,
        isEvmNetworkSelected,
        conversionRate
      }
    );
  }, [marketData, currentCurrency, isEvmNetworkSelected, conversionRate]);

  const hasAssetBalance =
  asset.balanceFiat && parseFloatSafe(asset.balanceFiat) > 0;

  return (
    <View style={styles.tokenDetailsContainer}>
      {asset.isETH && <StakingEarnings asset={asset} />}
      {isStablecoinLendingEnabled &&
      isSupportedLendingTokenByChainId(asset.symbol, asset.chainId ?? '') &&
      hasAssetBalance && <EarnEmptyStateCta token={asset} />}
      {(asset.isETH || tokenMetadata || !isEvmNetworkSelected) &&
      <TokenDetailsList tokenDetails={tokenDetails} />
      }
      {marketData && marketDetails &&
      <MarketDetailsList marketDetails={marketDetails} />
      }
    </View>);

};

export default TokenDetails;