import { createSelector } from 'reselect';
import { TokenListState } from '@metamask/assets-controllers';
import { RootState } from '../reducers';
import { tokenListToArray } from '../util/tokens';
import { createDeepEqualSelector } from '../selectors/util';
import { selectEvmChainId } from './networkController';

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
    tokenListControllerState?.tokensChainsCache?.[chainId]?.data || [],
);

/**
 * Return token list array from TokenListController.
 * Can pass directly into useSelector.
 */
export const selectTokenListArray = createDeepEqualSelector(
  selectTokenList,
  tokenListToArray,
);

const selectTokensChainsCache = (state: RootState) =>
  selectTokenListConstrollerState(state)?.tokensChainsCache;

/**
 * Return the multi-chain token list cache from TokenListController.
 * The deep compare only runs when the cache reference changes, and keeps the
 * returned reference stable when the content is equal.
 */
export const selectERC20TokensByChain = createDeepEqualSelector(
  selectTokensChainsCache,
  (tokensChainsCache) => tokensChainsCache,
);
