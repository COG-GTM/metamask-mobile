
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {



  SimulationTokenStandard } from
'@metamask/transaction-controller';
import {

  fetchTokenContractExchangeRates,
  CodefiTokenPricesServiceV2 } from
'@metamask/assets-controllers';

import {


  AssetType,
  FIAT_UNAVAILABLE } from

'./types';
import { getTokenDetails } from '../../../util/address';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency } from
'../../../selectors/currencyRateController';
import { useAsyncResultOrThrow } from '../../hooks/useAsyncResult';


const NATIVE_DECIMALS = 18;

const ERC20_DEFAULT_DECIMALS = 18;

// Converts a SimulationTokenStandard to a TokenStandard
function convertStandard(standard) {
  switch (standard) {
    case SimulationTokenStandard.erc20:
      return AssetType.ERC20;
    case SimulationTokenStandard.erc721:
      return AssetType.ERC721;
    case SimulationTokenStandard.erc1155:
      return AssetType.ERC1155;
    default:
      throw new Error(`Unknown token standard: ${standard}`);
  }
}

// Calculates the asset amount based on the balance change and decimals
function getAssetAmount(
{ isDecrease: isNegative, difference: quantity },
decimals)
{
  return (
    new BigNumber(quantity, 16).
    times(isNegative ? -1 : 1)
    // Shift the decimal point to the left by the number of decimals.
    .shiftedBy(-decimals));

}

// Fetches the decimals for the given token address.
async function fetchErc20Decimals(address, networkClientId) {
  try {
    const { decimals } = await getTokenDetails(address, undefined, undefined, networkClientId);
    return decimals ? parseInt(decimals, 10) : ERC20_DEFAULT_DECIMALS;
  } catch {
    return ERC20_DEFAULT_DECIMALS;
  }
}

// Fetches token details for all the token addresses in the SimulationTokenBalanceChanges
async function fetchAllErc20Decimals(
addresses,
networkClientId)
{
  const uniqueAddresses = [
  ...new Set(addresses.map((address) => address.toLowerCase()))];

  const allDecimals = await Promise.all(
    uniqueAddresses.map((address) => fetchErc20Decimals(address, networkClientId))
  );
  return Object.fromEntries(
    allDecimals.map((decimals, i) => [uniqueAddresses[i], decimals])
  );
}

/**
 * Retrieves token prices
 *
 * @param {string} nativeCurrency - native currency to fetch prices for.
 * @param {Hex[]} tokenAddresses - set of contract addresses
 * @param {Hex} chainId - current chainId
 * @returns The prices for the requested tokens.
 */
const fetchTokenExchangeRates = async (
nativeCurrency,
tokenAddresses,
chainId) =>
{
  try {
    return await fetchTokenContractExchangeRates({
      tokenPricesService: new CodefiTokenPricesServiceV2(),
      nativeCurrency,
      tokenAddresses,
      chainId
    });
  } catch (err) {
    return {};
  }
};

async function fetchTokenFiatRates(
fiatCurrency,
erc20TokenAddresses,
chainId)
{
  const tokenRates = await fetchTokenExchangeRates(
    fiatCurrency,
    erc20TokenAddresses,
    chainId
  );

  return Object.fromEntries(
    Object.entries(tokenRates).map(([address, rate]) => [
    address.toLowerCase(),
    rate]
    )
  );
}

// Compiles the balance change for the native asset
function getNativeBalanceChange(
nativeBalanceChange,
nativeFiatRate,
chainId)
{
  if (!nativeBalanceChange) {
    return undefined;
  }

  const asset = {
    type: AssetType.Native,
    chainId
  };

  const amount = getAssetAmount(nativeBalanceChange, NATIVE_DECIMALS);
  const fiatAmount = amount.times(nativeFiatRate).toNumber();

  return { asset, amount, fiatAmount };
}

// Compiles the balance changes for token assets
function getTokenBalanceChanges(
tokenBalanceChanges,
erc20Decimals,
erc20FiatRates,
chainId)
{
  return tokenBalanceChanges.map((tokenBc) => {
    const asset = {
      type: convertStandard(tokenBc.standard),
      address: tokenBc.address.toLowerCase(),
      tokenId: tokenBc.id,
      chainId
    };

    const decimals =
    asset.type === AssetType.ERC20 ?
    erc20Decimals[asset.address] ?? ERC20_DEFAULT_DECIMALS :
    0;
    const amount = getAssetAmount(tokenBc, decimals);

    const fiatRate = erc20FiatRates[tokenBc.address];
    const fiatAmount = fiatRate ?
    amount.times(fiatRate).toNumber() :
    FIAT_UNAVAILABLE;

    return { asset, amount, fiatAmount };
  });
}

// Compiles a list of balance changes from simulation data
export default function useBalanceChanges({
  chainId,
  simulationData,
  networkClientId




}) {
  const nativeFiatRate = useSelector((state) => selectConversionRateByChainId(state, chainId));
  const fiatCurrency = useSelector(selectCurrentCurrency);

  const { nativeBalanceChange, tokenBalanceChanges = [] } =
  simulationData ?? {};

  const erc20TokenAddresses = tokenBalanceChanges
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .filter((tbc) => tbc.standard === SimulationTokenStandard.erc20)
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .map((tbc) => tbc.address);

  const erc20Decimals = useAsyncResultOrThrow(
    () => fetchAllErc20Decimals(erc20TokenAddresses, networkClientId),
    [JSON.stringify(erc20TokenAddresses)]
  );

  const erc20FiatRates = useAsyncResultOrThrow(
    () => fetchTokenFiatRates(fiatCurrency, erc20TokenAddresses, chainId),
    [JSON.stringify(erc20TokenAddresses), chainId, fiatCurrency]
  );

  if (erc20Decimals.pending || erc20FiatRates.pending || !simulationData) {
    return { pending: true, value: [] };
  }

  const nativeChange = getNativeBalanceChange(
    nativeBalanceChange,
    nativeFiatRate,
    chainId
  );

  const tokenChanges = getTokenBalanceChanges(
    tokenBalanceChanges,
    erc20Decimals.value,
    erc20FiatRates.value,
    chainId
  );

  const balanceChanges = [
  ...(nativeChange ? [nativeChange] : []),
  ...tokenChanges];

  return { pending: false, value: balanceChanges };
}