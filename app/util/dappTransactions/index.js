import { remove0x } from '@metamask/utils';
import { isBN, hexToBN } from '../number';
import { safeToChecksumAddress } from '../address';
import Engine from '../../core/Engine';
import TransactionTypes from '../../core/TransactionTypes';
import { toLowerCaseEquals } from '../general';
import { strings } from '../../../locales/i18n';

import { estimateGas as controllerEstimateGas } from '../transaction-controller';


















































/**
 * Estimates gas limit
 *
 * @param {object} opts - Object containing optional attributes object to calculate gas with (amount, data and to)
 * @returns {object} - Object containing gas estimation
 */

export const estimateGas = async (
opts,
transaction) =>
{
  const { from, networkClientId, selectedAsset } = transaction;
  const {
    amount = transaction.value,
    data = transaction.data,
    to = transaction.to
  } = opts;

  let estimation;
  try {
    estimation = await controllerEstimateGas({
      value: amount,
      from,
      data,
      to: selectedAsset?.address ? selectedAsset.address : to
    }, networkClientId);
  } catch (e) {
    estimation = {
      gas: TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT
    };
  }
  return estimation;
};

/**
 * Validates Ether transaction amount
 *
 * @param {bool} allowEmpty - Whether the validation allows empty amount or not
 * @returns {string} - String containing error message whether the Ether transaction amount is valid or not
 */
export const validateEtherAmount = (
value,
from,
allowEmpty = true) =>
{
  if (!allowEmpty) {
    if (!value || !from) {
      return strings('transaction.invalid_amount');
    }
    if (value && !isBN(value)) {
      return strings('transaction.invalid_amount');
    }
  }
};





const getTokenBalance = async (
from,
selectedAsset,
selectedAddress,
contractBalances) =>
{
  const checksummedFrom = safeToChecksumAddress(from) || '';
  if (selectedAddress === from && contractBalances[selectedAsset.address]) {
    return hexToBN(
      remove0x(contractBalances[selectedAsset.address].toString())
    );
  }
  try {
    const { AssetsContractController } = Engine.context;
    // TODO: Roundtrip string conversion can be removed when bn.js v4 is superseded with v5
    const contractBalanceForAddress = await AssetsContractController.getERC20BalanceOf(
      selectedAsset.address,
      checksummedFrom
    );
    const contractBalanceForAddressBN = hexToBN(contractBalanceForAddress.toString(16));
    return contractBalanceForAddressBN;
  } catch (e) {

    // Don't validate balance if error
  }};

/**
 * Validates asset (ERC20) transaction amount
 *
 * @param {bool} allowEmpty - Whether the validation allows empty amount or not
 * @returns {string} - String containing error message whether the Ether transaction amount is valid or not
 */
export const validateTokenAmount = async (
value,
gas,
from,
selectedAsset,
selectedAddress,
contractBalances,
allowEmpty = true) =>
{
  if (!allowEmpty) {

    if (!value) {
      return strings('transaction.invalid_amount');
    }

    if (!gas) {
      return strings('transaction.invalid_gas');
    }

    if (!from) {
      return strings('transaction.invalid_from_address');
    }

    if (value && !isBN(value)) {
      return strings('transaction.invalid_amount');
    }

    const contractBalanceForAddress = await getTokenBalance(from, selectedAsset, selectedAddress, contractBalances);
    if (contractBalanceForAddress?.lt(value)) {
      return strings('transaction.insufficient');
    }
  }
};

export const validateCollectibleOwnership = async (
address,
tokenId,
selectedAddress) =>
{
  const { AssetsContractController } = Engine.context;

  try {
    const owner = await AssetsContractController.getERC721OwnerOf(
      address,
      tokenId
    );
    const isOwner = toLowerCaseEquals(owner, selectedAddress);

    return !isOwner ?
    strings('transaction.invalid_collectible_ownership') :
    undefined;
  } catch (e) {
    return strings('transaction.invalid_collectible_ownership');
  }
};









export const validateAmount = async (
assetType,
address,
tokenId,
selectedAddress,
transaction,
contractBalances,
allowEmpty = true) =>
{
  const { value, from, gas, selectedAsset } = transaction;

  const validations = {
    ETH: () => validateEtherAmount(value, from, allowEmpty),
    ERC20: async () =>
    await validateTokenAmount(
      value,
      gas,
      from,
      selectedAsset,
      selectedAddress,
      contractBalances,
      allowEmpty
    ),
    ERC721: async () =>
    await validateCollectibleOwnership(address, tokenId, selectedAddress)
  };

  return !validations[assetType] ? false : await validations[assetType]();
};








export const getGasAnalyticsParams = (
transaction,
activeTabUrl,
gasEstimateType) =>
{
  try {
    const { selectedAsset, origin } = transaction;
    return {
      dapp_host_name: origin,
      dapp_url: activeTabUrl,
      active_currency: { value: selectedAsset?.symbol, anonymous: true },
      gas_estimate_type: gasEstimateType
    };
  } catch (error) {
    return {};
  }
};










/**
 * Updates gas and gasPrice in transaction state
 *
 * @param {object} gasLimit - BN object containing gasLimit value
 * @param {object} gasPrice - BN object containing gasPrice value
 * @param {function} setTransactionObject - Sets any attribute in transaction object
 */
export const handleGasFeeSelection = (
gasLimit,
gasPrice,
setTransactionObject) =>
{
  const transactionObject = {
    gas: gasLimit,
    gasPrice
  };
  setTransactionObject(transactionObject);
};

/**
 * Updates gas limit of the current transaction object
 *
 */
export const handleGetGasLimit = async (
transaction,
setTransactionObject) =>
{
  if (!Object.keys(transaction.selectedAsset).length) return;
  const { gas } = await estimateGas({}, transaction);
  setTransactionObject({ gas: hexToBN(gas) });
};