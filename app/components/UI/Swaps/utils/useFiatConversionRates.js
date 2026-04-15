import { useAsyncResultOrThrow } from '../../../hooks/useAsyncResult';
import { safeToChecksumAddress } from '../../../../util/address';
import {
  CodefiTokenPricesServiceV2,
  fetchTokenContractExchangeRates } from

'@metamask/assets-controllers';




















/**
 * Custom hook to fetch fiat conversion rates for token fees in gas-included swaps
 * @param {Object} options - The options for fetching conversion rates
 * @param {boolean} options.canUseGasIncludedSwap - Whether gas-included swap feature is available
 * @param {Object} options.selectedQuote - The currently selected quote
 * @param {Object} options.tradeTxTokenFee - The token fee information for the trade
 * @param {string} options.currentCurrency - The current currency
 * @param {string} options.chainId - The chain ID
 * @returns {Object|undefined} The token exchange rates or undefined if not applicable
 */
export function useFiatConversionRates({
  canUseGasIncludedSwap,
  selectedQuote,
  tradeTxTokenFee,
  currentCurrency,
  chainId
}) {
  return useAsyncResultOrThrow(async () => {
    if (!canUseGasIncludedSwap || !selectedQuote?.trade) {
      return undefined;
    }

    const { token, balanceNeededToken } = tradeTxTokenFee;
    if (!token?.decimals || !token?.address || !balanceNeededToken) {
      return undefined;
    }

    const checksumAddress = safeToChecksumAddress(token.address);
    if (!checksumAddress) return undefined;

    return fetchTokenContractExchangeRates({
      tokenPricesService: new CodefiTokenPricesServiceV2(),
      nativeCurrency: currentCurrency,
      tokenAddresses: [checksumAddress],
      chainId
    });
  }, [
  canUseGasIncludedSwap,
  selectedQuote?.trade,
  tradeTxTokenFee,
  currentCurrency,
  chainId]
  );
}