import { createSelector } from 'reselect';
import { TokenListMap, TokenListState } from '@metamask/assets-controllers';
import { RootState } from '../reducers';
import { tokenListToArray } from '../util/tokens';
import { selectEvmChainId } from './networkController';

const EMPTY_TOKEN_LIST: TokenListMap = {};

const selectTokenListConstrollerState = (state: RootState) =>
  state.engine.backgroundState.TokenListController;

/**
 * Return token list from TokenListController.
 * Can pass directly into useSelector.
 */
export const selectTokenList = createSelector(
  selectTokenListConstrollerState,
  selectEvmChainId,
  (tokenListControllerState: TokenListState, chainId) =>
    tokenListControllerState?.tokensChainsCache?.[chainId]?.data ||
    EMPTY_TOKEN_LIST,
);

/**
 * Return token list array from TokenListController.
 * Can pass directly into useSelector.
 */
export const selectTokenListArray = createSelector(
  selectTokenList,
  tokenListToArray,
);

/**
 * Return the token list cache for all chains.
 * The engine reducer only replaces controller state when it changes, so the
 * reference is stable without a deep comparison of the (large) cache.
 */
export const selectERC20TokensByChain = createSelector(
  selectTokenListConstrollerState,
  (tokenListControllerState) => tokenListControllerState?.tokensChainsCache,
);
