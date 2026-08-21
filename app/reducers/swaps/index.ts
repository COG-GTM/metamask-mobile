/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
import type {
  FeatureFlags,
  GlobalFeatureFlags,
  NetworkFeatureFlagsAll,
} from '@metamask/swaps-controller/dist/types';
import type { TokenListMap, TokenListToken } from '@metamask/assets-controllers';
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
import type { RootState } from '..';

/**
 * Token as it is kept in the swaps state, merged from the tokens known by the
 * SwapsController and the ones held by the user.
 */
export interface SwapsToken {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  occurrences?: number;
  iconUrl?: string;
  aggregators?: string[];
}

/**
 * Token as it comes from either the SwapsController or the TokensController,
 * before it is normalised by the selectors below.
 */
interface SwapsTokenSource extends SwapsToken {
  hasBalanceError?: boolean;
  image?: string;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: Hex): Hex =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? (NETWORKS_CHAIN_ID.MAINNET as Hex)
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS' as const;
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED' as const;
const MAX_TOKENS_WITH_BALANCE = 5;

export interface SwapsSetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: Hex;
    featureFlags?: FeatureFlags | null;
  };
}

export interface SwapsSetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SwapsSetLivenessAction | SwapsSetHasOnboardedAction;

// * Action Creator
export const setSwapsLiveness = (
  chainId: Hex,
  featureFlags?: FeatureFlags | null,
): SwapsSetLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SwapsSetHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: string,
  tokens: SwapsToken[],
  tokenList: TokenListMap | TokenListToken[],
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const checksumAddress = safeToChecksumAddress(token.address);
    const tokenMetadata =
      Array.isArray(tokenList) || !checksumAddress
        ? undefined
        : tokenList[checksumAddress];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

/**
 * Feature flags of a single chain, as returned by the swaps API. The swaps
 * controller only describes part of them, consumers rely on the flags that are
 * described here.
 */
export interface SwapsChainFeatureFlags
  extends Omit<NetworkFeatureFlagsAll, 'smartTransactions' | 'fallback_to_v1'> {
  fallback_to_v1: boolean;
  smartTransactions: NetworkFeatureFlagsAll['smartTransactions'] &
    GlobalFeatureFlags['smartTransactions'] & {
      mobileReturnTxHashAsap: boolean;
      batchStatusPollingInterval: number;
    };
}

/**
 * Swaps state for a single chain, keyed by chain id on the swaps state.
 */
export interface SwapsChainState {
  isLive: boolean;
  featureFlags?: NetworkFeatureFlagsAll;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: GlobalFeatureFlags;
  [chainId: `0x${string}`]: SwapsChainState | undefined;
}

/**
 * Chain scoped swaps state is stored on the swaps state keyed by chain id, so
 * lookups by a chain id that is not statically known to be hexadecimal have to
 * go through this accessor.
 */
const getChainState = (
  swapsState: SwapsState,
  chainId: string,
): SwapsChainState | undefined => swapsState[chainId as Hex];

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState): SwapsState => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => getChainState(swapsState, chainId)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: string) => chainId],
  (swapsState, chainId) => getChainState(swapsState, chainId)?.isLive || false,
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
  (_state: RootState, transactionChainId?: string) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId): SwapsChainFeatureFlags => {
    const chainState = getChainState(swapsState, chainId);
    if (!chainState) {
      throw new TypeError(
        `Cannot read swaps feature flags of unknown chain ${chainId}`,
      );
    }
    // Consumers expect the whole set of chain feature flags, which are only
    // populated once the swaps liveness has been fetched.
    const chainFeatureFlags = (chainState.featureFlags ||
      {}) as SwapsChainFeatureFlags;
    return {
      ...chainFeatureFlags,
      smartTransactions: {
        ...(chainFeatureFlags.smartTransactions || {}),
        ...(swapsState.featureFlags?.smartTransactions || {}),
      },
    };
  },
);

/**
 * Returns the swaps onboarded state
 */

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.hasOnboarded,
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
  (swapsTokens, tokens) => {
    const allSwapsTokens: SwapsTokenSource[] = [
      ...(swapsTokens || []),
      ...(tokens || []),
    ];
    const values = allSwapsTokens
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
      }, new Map<string, SwapsToken>())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (swapsTokens, allTokens, currentUserAddress) => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsTokenSource[]>(
      (acc, tokensElement) => {
        const found =
          (currentUserAddress ? tokensElement[currentUserAddress] : undefined) ||
          [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const allSwapsTokens: SwapsTokenSource[] = [
      ...(swapsTokens || []),
      ...(allUserTokensCrossChains || []),
    ];
    const values = allSwapsTokens
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
      }, new Map<string, SwapsToken>())
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

    return addMetadata(chainId, tokens, tokenList);
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
  (
    chainId,
    tokens,
    tokenList,
    balances: Record<string, string | number>,
  ) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(Number(balanceB), Number(balanceA)) ? -1 : 1,
      )
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: SwapsToken[] = [];
    const originalTokens: SwapsToken[] = [];

    for (const baseToken of baseTokens) {
      if (tokensAddressesWithBalance.includes(baseToken.address)) {
        tokensWithBalance.push(baseToken);
      } else {
        originalTokens.push(baseToken);
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
  (chainId, tokens, tokenList, assets) => {
    if (!assets || !tokens) {
      return [];
    }
    const result = assets
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((token): token is SwapsToken => Boolean(token));
    return addMetadata(chainId, result, tokenList);
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

function swapsReducer(
  state: SwapsState = initialState,
  action: SwapsAction,
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = getChainState(state, chainId);

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

      const chainFeatureFlags = getChainFeatureFlags(featureFlags, chainId);
      const liveness = getSwapsLiveness(featureFlags, chainId);

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
