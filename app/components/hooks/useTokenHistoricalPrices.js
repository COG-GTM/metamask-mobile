
import { getDecimalChainId } from '../../util/networks';
import { useState, useEffect } from 'react';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { selectMultichainHistoricalPrices } from '../../selectors/multichain';
///: END:ONLY_INCLUDE_IF
import { useSelector } from 'react-redux';
import { selectIsEvmNetworkSelected } from '../../selectors/multichainNetworkController';
import Engine from '../../core/Engine';






const placeholderPrices = Array(289).fill(['0', 0]);

export const standardizeTimeInterval = (timePeriod) => {
  switch (timePeriod) {
    case '1d':
      return 'P1D';
    case '1w':
      return 'P7D';
    case '7d':
      return 'P7D';
    case '1m':
      return 'P1M';
    case '3m':
      return 'P3M';
    case '1y':
      return 'P1Y';
    case '3y':
      return 'P3Y';
    default:
      return 'P1D';
  }
};

const useTokenHistoricalPrices = ({
  asset,
  address,
  chainId,
  timePeriod,
  from,
  to,
  vsCurrency








}) =>



{
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const multichainHistoricalPrices = useSelector(
    selectMultichainHistoricalPrices
  );
  ///: END:ONLY_INCLUDE_IF
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);
  const [prices, setPrices] = useState(placeholderPrices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        if (!isEvmSelected) {
          const caip19Address = asset.address;
          const standardizedTimeInterval = standardizeTimeInterval(timePeriod);

          await Engine.context.MultichainAssetsRatesController.fetchHistoricalPricesForAsset(
            caip19Address
          );
          const result =
          multichainHistoricalPrices[caip19Address][vsCurrency].intervals[
          standardizedTimeInterval];


          // Transform to ensure first value is string and second is number with max precision
          const transformedResult = result.map(
            ([timestamp, price]) =>
            [timestamp.toString(), Number(price)]
          );
          setPrices(transformedResult);
        } else {
          const baseUri = 'https://price.api.cx.metamask.io/v1';
          const uri = new URL(
            `${baseUri}/chains/${getDecimalChainId(
              chainId
            )}/historical-prices/${address}`
          );
          uri.searchParams.set(
            'timePeriod',
            timePeriod === '1w' ? '7d' : timePeriod
          );
          uri.searchParams.set('vsCurrency', vsCurrency);
          if (from && to) {
            uri.searchParams.set('from', from.toString());
            uri.searchParams.set('to', to.toString());
          }

          const response = await fetch(uri.toString());
          const data = await response.json();
          setPrices(data.prices);
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
  }, [
  address,
  chainId,
  timePeriod,
  from,
  to,
  vsCurrency,
  isEvmSelected,
  asset.address,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  multichainHistoricalPrices
  ///: END:ONLY_INCLUDE_IF
  ]);

  return { data: prices, isLoading, error };
};

export default useTokenHistoricalPrices;