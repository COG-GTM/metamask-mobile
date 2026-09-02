import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import { FeatureFlags } from '@metamask/swaps-controller/dist/types';
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

/**
 * The Redux state as seen by the selectors in this module.
 *
 * These selectors are composed into selectors used all over the app and are
 * also called with partial states (for instance from tests). Keeping the state
 * parameter untyped, as it was before this module was converted to TypeScript,
 * keeps the inferred state type of every downstream selector unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SwapsSelectorState = any;

/**
 * A token as stored in the swaps state. Tokens come from a mix of the swaps
 * controller and the user's own token list, so only the properties this
 * reducer relies on are described here.
 */
interface SwapsToken {
  address: string;
  decimals?: string | number;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
}

interface SwapsTokenMetadata {
  name?: string;
}

/**
 * Feature flags for a single chain, as returned by the swaps API.
 */
interface SwapsChainFeatureFlags {
  smartTransactions?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * The feature flags payload of the `SWAPS_SET_LIVENESS` action: feature flags
 * per chain name plus the global feature flags.
 */
interface SwapsFeatureFlags {
  smart_transactions?: unknown;
  smartTransactions?: Record<string, unknown>;
  [chainName: string]: unknown;
}

/**
 * Feature flags as consumed by the smart transactions code. The expected shape
 * differs between call sites (see `SubmitSmartTransactionRequest` and the swaps
 * controller `FeatureFlags`), so it stays untyped as it was before this module
 * was converted to TypeScript.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChainFeatureFlags = any;

interface SwapsChainState {
  isLive?: boolean;
  featureFlags?: SwapsChainFeatureFlags;
}

interface SwapsGlobalFeatureFlags {
  smart_transactions?: unknown;
  smartTransactions?: Record<string, unknown>;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsGlobalFeatureFlags;
  // Liveness and feature flags per chain, keyed by chain ID
  [chainId: `0x${string}`]: SwapsChainState;
}

interface SwapsAction {
  type: string | null;
  payload?: { chainId: string; featureFlags?: SwapsFeatureFlags | null } | boolean;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: string): Hex =>
  __DEV__ && allowedTestnetChainIds.includes(chainId as Hex)
    ? (NETWORKS_CHAIN_ID.MAINNET as Hex)
    : (chainId as Hex);

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags?: SwapsFeatureFlags | null,
) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: Hex,
  tokens: SwapsToken[],
  // The token list is keyed by checksum address, but its type varies depending
  // on whether the token list controller has been populated yet.
  tokenList: unknown,
) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  const tokenMetadataByAddress = tokenList as Record<
    string,
    SwapsTokenMetadata | undefined
  >;
  return tokens.map((token) => {
    const tokenMetadata =
      tokenMetadataByAddress[safeToChecksumAddress(token.address) as string];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: SwapsSelectorState): SwapsState =>
  state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => swapsState[chainId]?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: SwapsSelectorState, chainId: Hex) => chainId],
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
  (_state: SwapsSelectorState, transactionChainId?: Hex) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId): ChainFeatureFlags => ({
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

const selectSwapsControllerState = (state: SwapsSelectorState) =>
  state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (
  state: SwapsSelectorState,
): SwapsToken[] => state.engine.backgroundState.SwapsController.tokens;

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

const dedupeTokens = (tokens: SwapsToken[]) => {
  const values = tokens
    .filter(Boolean)
    .reduce(
      (
        map: Map<string, SwapsToken>,
        { hasBalanceError, image, ...token },
      ) => {
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
      },
      new Map<string, SwapsToken>(),
    )
    .values();

  return [...values];
};

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens, tokens) =>
    dedupeTokens([...(swapsTokens || []), ...(tokens || [])]),
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (swapsTokens, allTokens, currentUserAddress) => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce(
      (acc: SwapsToken[], tokensElement) => {
        const found = tokensElement[currentUserAddress as string] || [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    return dedupeTokens([
      ...(swapsTokens || []),
      ...(allUserTokensCrossChains || []),
    ]);
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
  (chainId, tokens, tokenList, balances) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => (balance as unknown) !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(balanceB as unknown as number, balanceA as unknown as number)
          ? -1
          : 1,
      )
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: SwapsToken[] = [];
    const originalTokens: SwapsToken[] = [];

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
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
  (chainId, tokens, tokenList, swapsTopAssets) => {
    if (!swapsTopAssets || !tokens) {
      return [];
    }
    const result = swapsTopAssets
      .map(({ address }: { address: string }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean) as SwapsToken[];
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

/* eslint-disable @typescript-eslint/default-param-last */
function swapsReducer(
  state: SwapsState = initialState,
  action: SwapsAction,
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload as {
        chainId: string;
        featureFlags?: SwapsFeatureFlags | null;
      };
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId];

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

      const chainFeatureFlags = getChainFeatureFlags(
        featureFlags as unknown as FeatureFlags,
        chainId,
      );
      const liveness = getSwapsLiveness(
        featureFlags as unknown as FeatureFlags,
        chainId,
      );

      const chain = {
        ...data,
        featureFlags: chainFeatureFlags as unknown as SwapsChainFeatureFlags,
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
