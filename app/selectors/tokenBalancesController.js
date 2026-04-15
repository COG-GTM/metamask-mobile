/* eslint-disable import/prefer-default-export */

import { createSelector } from 'reselect';


import { selectSelectedInternalAccountAddress } from './accountsController';
import { selectEvmChainId } from './networkController';
import { createDeepEqualSelector } from './util';
import { selectShowFiatInTestnets } from './settings';
import { isTestNet } from '../util/networks';

const selectTokenBalancesControllerState = (state) =>
state.engine.backgroundState.TokenBalancesController;

export const selectTokensBalances = createSelector(
  selectTokenBalancesControllerState,
  (tokenBalancesControllerState) =>
  tokenBalancesControllerState.tokenBalances
);

export const selectContractBalances = createSelector(
  selectTokenBalancesControllerState,
  selectSelectedInternalAccountAddress,
  selectEvmChainId,
  (
  tokenBalancesControllerState,
  selectedInternalAccountAddress,
  chainId) =>

  tokenBalancesControllerState.tokenBalances?.[
  selectedInternalAccountAddress]?.[
  chainId] ?? {}
);

export const selectAllTokenBalances = createDeepEqualSelector(
  selectTokenBalancesControllerState,
  (tokenBalancesControllerState) =>
  tokenBalancesControllerState.tokenBalances
);

export const selectAddressHasTokenBalances = createDeepEqualSelector(
  [
  selectAllTokenBalances,
  selectSelectedInternalAccountAddress,
  selectShowFiatInTestnets],

  (tokenBalances, address, showFiatInTestNets) => {
    if (!address) {
      return false;
    }

    const addressChainTokens = tokenBalances[address] ?? {};
    const chainTokens = Object.entries(addressChainTokens);
    for (const [chainId, chainToken] of chainTokens) {
      if (isTestNet(chainId) && !showFiatInTestNets) {
        continue;
      }

      const hexBalances = Object.values(chainToken ?? {});
      if (
      hexBalances.some((hexBalance) => hexBalance && hexBalance !== '0x0'))
      {
        return true;
      }
    }

    // Exhausted all tokens for given account address
    return false;
  }
);