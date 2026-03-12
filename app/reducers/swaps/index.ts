import { createSelector } from 'reselect';
import { isMainnetByChainId } from '../../util/networks';
import { safeToChecksumAddress } from '../../util/address';
import { toLowerCaseEquals } from '../../util/general';
import { lte } from '../../util/lodash';
import { selectEvmChainId } from '../../selectors/networkController';
import {
  selectAllTokens,
  selectTokens,
} from '../../selectors/tokensController';
import { selectTokenList } from '../../selectors/tokenListController';
import { selectContractBalances } from '../../selectors/tokenBalancesController';
import { getChainFeatureFlags, getSwapsLiveness } from './utils';
import { allowedTestnetChainIds } from '../../components/UI/Swaps/utils';
import { NETWORKS_CHAIN_ID } from '../../constants/network';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RootState = any;

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFeatureFlagChainId = (chainId: any) =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setSwapsLiveness = (chainId: string, featureFlags: any) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addMetadata(chainId: string, tokens: any[], tokenList: any) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tokens.map((token: any) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address) as string];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState) => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: any, chainId: any) => swapsState[chainId]?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [swapsStateSelector, (_state: any, chainId: any) => chainId],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: any, chainId: any) => swapsState[chainId]?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: any) => {
    const globalFlags = swapsState.featureFlags;
    const isEnabled = Boolean(globalFlags?.smartTransactions?.mobileActive);
    return isEnabled;
  },
);

/**
 * Returns the swaps feature flags
 */
export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_state: any, transactionChainId?: any) =>
    transactionChainId || selectEvmChainId(_state),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: any, chainId: any) => ({
    ...swapsState[chainId].featureFlags,
    smartTransactions: {
      ...(swapsState[chainId].featureFlags?.smartTransactions || {}),
      ...(swapsState.featureFlags?.smartTransactions || {}),
    },
  }),
);

/**
 * Returns the swaps onboarded state
 */

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: any) => swapsState.hasOnboarded,
);

const selectSwapsControllerState = (state: RootState) =>
  state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (state: RootState) =>
  state.engine.backgroundState.SwapsController.tokens;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.approvalTransaction,
);
export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.quoteValues,
);
export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.quotes,
);
export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.aggregatorMetadata,
);
export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.error,
);
export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.quoteRefreshSeconds,
);
export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.usedGasEstimate,
);
export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.usedCustomGas,
);
export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.topAggId,
);
export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.pollingCyclesLeft,
);
export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.quotesLastFetched,
);
export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.isInPolling,
);

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsTokens: any, tokens: any) => {
    const values = [...(swapsTokens || []), ...(tokens || [])]
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((map: Map<string, any>, { hasBalanceError, image, ...token }: any) => {
        const key = token.address.toLowerCase();

        if (!map.has(key)) {
          map.set(key, {
            occurrences: 0,
            ...token,
            decimals: Number(token.decimals),
            address: key,
          });
        }
        return map;
      }, new Map())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsTokens: any, allTokens: any, currentUserAddress: any) => {
    const allTokensArr = Object.values(allTokens);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUserTokensCrossChains = allTokensArr.reduce<any[]>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: any[], tokensElement: any) => {
        const found = tokensElement[currentUserAddress] || [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const values = [...(swapsTokens || []), ...(allUserTokensCrossChains || [])]
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((map: Map<string, any>, { hasBalanceError, image, ...token }: any) => {
        const key = token.address.toLowerCase();

        if (!map.has(key)) {
          map.set(key, {
            occurrences: 0,
            ...token,
            decimals: Number(token.decimals),
            address: key,
          });
        }
        return map;
      }, new Map())
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chainId: any, tokens: any, tokenList: any) => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.topAssets,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsControllerState: any) => swapsControllerState.chainCache,
);

/**
 * Returns a memoized object that only has the addesses of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
export const swapsTokensObjectSelector = createSelector(
  swapsControllerAndUserTokens,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tokens: any[]) => {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};
    for (const token of tokens) {
      result[token.address] = undefined;
    }
    return result;
  },
);

/**
 * Returns a memoized object that only has the addresses cross chains of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
export const swapsTokensMultiChainObjectSelector = createSelector(
  swapsControllerAndUserTokensMultichain,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tokens: any[]) => {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};
    for (const token of tokens) {
      result[token.address] = undefined;
    }
    return result;
  },
);

/**
 * Returns an array of tokens to display by default on the selector modal
 * based on the current account's balances.
 */
export const swapsTokensWithBalanceSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  selectContractBalances,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chainId: any, tokens: any, tokenList: any, balances: any) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(([, balance]: [string, any]) => balance !== 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort(([, balanceA]: [string, any], [, balanceB]: [string, any]) => (lte(balanceB, balanceA) ? -1 : 1))
      .map(([address]) => address.toLowerCase());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokensWithBalance: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalTokens: any[] = [];

    for (let i = 0; i < baseTokens.length; i++) {
      if (tokensAddressesWithBalance.includes(baseTokens[i].address)) {
        tokensWithBalance.push(baseTokens[i]);
      } else {
        originalTokens.push(baseTokens[i]);
      }

      if (
        tokensWithBalance.length === tokensAddressesWithBalance.length &&
        tokensWithBalance.length + originalTokens.length >=
          MAX_TOKENS_WITH_BALANCE
      ) {
        break;
      }
    }

    const result = [...tokensWithBalance, ...originalTokens].slice(
      0,
      Math.max(tokensWithBalance.length, MAX_TOKENS_WITH_BALANCE),
    );
    return addMetadata(chainId, result, tokenList);
  },
);

/**
 * Returns an array of tokens to display by default on the selector modal
 * based on the current account's balances.
 */
export const swapsTopAssetsSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  topAssets,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chainId: any, tokens: any, tokenList: any, topAssets: any) => {
    if (!topAssets || !tokens) {
      return [];
    }
    const result = topAssets
      .map(({ address }: { address: string }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokens?.find((token: any) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean);
    return addMetadata(chainId, result, tokenList);
  },
);

// * Reducer
export const initialState = {
  isLive: true, // TODO: should we remove it?
  hasOnboarded: true, // TODO: Once we have updated UI / content for the modal, we should enable it again.

  featureFlags: undefined,
  '0x1': {
    isLive: true,
    featureFlags: undefined,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function swapsReducer(state = initialState, action: any) {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (state as any)[chainId];

      const chainNoFlags = {
        ...data,
        featureFlags: undefined,
        isLive: false,
      };

      if (!featureFlags) {
        return {
          ...state,
          [chainId]: chainNoFlags,
          [rawChainId]: chainNoFlags,
          featureFlags: undefined,
        };
      }

      const chainFeatureFlags = getChainFeatureFlags(featureFlags, chainId as `0x${string}`);
      const liveness = getSwapsLiveness(featureFlags, chainId as `0x${string}`);

      const chain = {
        ...data,
        featureFlags: chainFeatureFlags,
        isLive: liveness,
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId]: chain,
        featureFlags: {
          smart_transactions: featureFlags.smart_transactions,
          smartTransactions: featureFlags.smartTransactions,
        },
      };
    }
    case SWAPS_SET_HAS_ONBOARDED: {
      return {
        ...state,
        hasOnboarded: Boolean(action.payload),
      };
    }
    default: {
      return state;
    }
  }
}

export default swapsReducer;
