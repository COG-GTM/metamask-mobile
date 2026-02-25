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

interface SmartTransactionsFlags {
  mobileActive?: boolean;
  [key: string]: unknown;
}

interface ChainFeatureFlags {
  smartTransactions?: SmartTransactionsFlags;
  [key: string]: unknown;
}

interface SwapsChainState {
  isLive: boolean;
  featureFlags: ChainFeatureFlags | undefined;
}

interface SwapsFeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: SmartTransactionsFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: SwapsFeatureFlags | undefined;
  [chainId: string]: SwapsChainState | boolean | SwapsFeatureFlags | undefined;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (chainId: string, featureFlags: Record<string, unknown> | null) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

interface TokenWithMetadata {
  address: string;
  symbol?: string;
  decimals?: number | string;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

function addMetadata(chainId: string, tokens: TokenWithMetadata[], tokenList: Record<string, { name: string }>) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address) as string];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swapsStateSelector = (state: any) => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => swapsState[chainId]?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: unknown, chainId: string) => chainId],
  (swapsState, chainId) => swapsState[chainId]?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState) => {
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
  (_state: unknown, transactionChainId?: string) =>
    transactionChainId || selectEvmChainId(_state as Parameters<typeof selectEvmChainId>[0]),
  (swapsState, chainId) => ({
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
  (swapsState) => swapsState.hasOnboarded,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectSwapsControllerState = (state: any) =>
  state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swapsControllerTokens = (state: any) =>
  state.engine.backgroundState.SwapsController.tokens;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.approvalTransaction,
);
export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.quoteValues,
);
export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.quotes,
);
export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.aggregatorMetadata,
);
export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.error,
);
export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.quoteRefreshSeconds,
);
export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.usedGasEstimate,
);
export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.usedCustomGas,
);
export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.topAggId,
);
export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.pollingCyclesLeft,
);
export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.quotesLastFetched,
);
export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.isInPolling,
);

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens: TokenWithMetadata[], tokens: TokenWithMetadata[]) => {
    const values = [...(swapsTokens || []), ...(tokens || [])]
      .filter(Boolean)
      .reduce((map, { hasBalanceError, image, ...token }) => {
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
      }, new Map<string, TokenWithMetadata>())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (swapsTokens: TokenWithMetadata[], allTokens: Record<string, Record<string, TokenWithMetadata[]>>, currentUserAddress: string) => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce(
      (acc: TokenWithMetadata[], tokensElement) => {
        const found = tokensElement[currentUserAddress] || [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const values = [...(swapsTokens || []), ...(allUserTokensCrossChains || [])]
      .filter(Boolean)
      .reduce((map, { hasBalanceError, image, ...token }) => {
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
      }, new Map<string, TokenWithMetadata>())
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  (chainId, tokens, tokenList) => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList as Record<string, { name: string }>);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.topAssets,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.chainCache,
);

/**
 * Returns a memoized object that only has the addesses of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
export const swapsTokensObjectSelector = createSelector(
  swapsControllerAndUserTokens,
  (tokens) => {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    const result: Record<string, undefined> = {};
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
  (tokens) => {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    const result: Record<string, undefined> = {};
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
  (chainId, tokens, tokenList, balances) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) => (lte(balanceB, balanceA) ? -1 : 1))
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: TokenWithMetadata[] = [];
    const originalTokens: TokenWithMetadata[] = [];

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
    return addMetadata(chainId, result, tokenList as Record<string, { name: string }>);
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
  (chainId, tokens, tokenList, topAssetsData) => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = topAssetsData
      .map(({ address }: { address: string }) =>
        tokens?.find((token: TokenWithMetadata) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean);
    return addMetadata(chainId, result, tokenList as Record<string, { name: string }>);
  },
);

// * Reducer
export const initialState: SwapsState = {
  isLive: true, // TODO: should we remove it?
  hasOnboarded: true, // TODO: Once we have updated UI / content for the modal, we should enable it again.

  featureFlags: undefined,
  '0x1': {
    isLive: true,
    featureFlags: undefined,
  },
};

interface SetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: string;
    featureFlags: Record<string, unknown> | null;
  };
}

interface SetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SetLivenessAction | SetHasOnboardedAction;

function swapsReducer(state: SwapsState = initialState, action: SwapsAction): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as SwapsChainState | undefined;

      const chainNoFlags: SwapsChainState = {
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

      const chainFeatureFlags = getChainFeatureFlags(featureFlags as Parameters<typeof getChainFeatureFlags>[0], chainId as `0x${string}`);
      const liveness = getSwapsLiveness(featureFlags as Parameters<typeof getSwapsLiveness>[0], chainId as `0x${string}`);

      const chain: SwapsChainState = {
        ...data,
        featureFlags: chainFeatureFlags as ChainFeatureFlags,
        isLive: liveness as boolean,
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId]: chain,
        featureFlags: {
          smart_transactions: (featureFlags as Record<string, unknown>).smart_transactions as Record<string, unknown>,
          smartTransactions: (featureFlags as Record<string, unknown>).smartTransactions as SmartTransactionsFlags,
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
