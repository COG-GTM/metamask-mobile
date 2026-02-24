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
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';

type ChainId = `0x${string}`;

type SmartTransactionsFlags = Record<string, unknown>;

type SwapsChainFeatureFlags = Record<string, unknown> & {
  smartTransactions?: SmartTransactionsFlags;
};

type SwapsGlobalFeatureFlags = Record<string, unknown> & {
  smartTransactions?: SmartTransactionsFlags;
};

interface SwapsChainState {
  isLive?: boolean;
  featureFlags?: SwapsChainFeatureFlags;
}

interface SwapsState {
  isLive?: boolean;
  hasOnboarded?: boolean;
  featureFlags?: SwapsGlobalFeatureFlags;
  [chainId: string]: unknown;
}

interface SwapToken {
  address: string;
  decimals: number | string;
  name?: string;
  symbol?: string;
  [key: string]: unknown;
}

interface SwapsAction {
  type: string | null;
  payload?: unknown;
}

interface SwapsControllerState {
  tokens?: SwapToken[];
  approvalTransaction?: unknown;
  quoteValues?: unknown;
  quotes?: unknown;
  aggregatorMetadata?: unknown;
  error?: unknown;
  quoteRefreshSeconds?: unknown;
  usedGasEstimate?: unknown;
  usedCustomGas?: unknown;
  topAggId?: unknown;
  pollingCyclesLeft?: unknown;
  quotesLastFetched?: unknown;
  isInPolling?: unknown;
  topAssets?: { address: string }[];
  chainCache?: unknown;
  [key: string]: unknown;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: ChainId): ChainId =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (chainId: ChainId, featureFlags: Record<string, unknown>) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: string,
  tokens: SwapToken[],
  tokenList: Record<string, { name: string }>,
) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const checksum = safeToChecksumAddress(token.address) as string;
    const tokenMetadata = tokenList[checksum];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

const getChainState = (swapsState: SwapsState, chainId: string) => {
  const chainEntry = swapsState[chainId];
  if (!chainEntry || typeof chainEntry !== 'object') {
    throw new Error(`No swaps state for chainId: ${chainId}`);
  }
  return chainEntry as SwapsChainState;
};

const isTokenLike = (value: unknown): value is SwapToken => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return typeof (value as SwapToken).address === 'string';
};

// * Selectors
const chainIdSelector = (state: unknown) => selectEvmChainId(state as never) as string;
const swapsStateSelector = (state: { swaps: SwapsState }) => state.swaps;

const selectTokensFromState = (state: unknown) => selectTokens(state as never) as unknown;
const selectAllTokensFromState = (state: unknown) =>
  selectAllTokens(state as never) as unknown;
const selectSelectedInternalAccountAddressFromState = (state: unknown) =>
  selectSelectedInternalAccountAddress(state as never) as string | undefined;
const selectTokenListFromState = (state: unknown) =>
  selectTokenList(state as never) as unknown;
const selectContractBalancesFromState = (state: unknown) =>
  selectContractBalances(state as never) as unknown;

/**
 * Returns the swaps liveness state
 */
export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId: string) =>
    Boolean(getChainState(swapsState, chainId)?.isLive),
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: unknown, chainId: string) => chainId],
  (swapsState, chainId: string) =>
    Boolean(getChainState(swapsState, chainId)?.isLive),
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
  chainIdSelector,
  (_state: unknown, transactionChainId?: string) => transactionChainId,
  (swapsState, currentChainId: string, transactionChainId?: string) => {
    const chainId = transactionChainId || currentChainId;
    const chainState = getChainState(swapsState, chainId);

    const chainFlags = (chainState.featureFlags ?? {}) as SwapsChainFeatureFlags;
    const globalFlags = (swapsState.featureFlags ?? {}) as SwapsGlobalFeatureFlags;

    return {
      ...chainFlags,
      smartTransactions: {
        ...(chainFlags.smartTransactions ?? {}),
        ...(globalFlags.smartTransactions ?? {}),
      },
    };
  },
);

/**
 * Returns the swaps onboarded state
 */
export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => Boolean(swapsState.hasOnboarded),
);

const selectSwapsControllerState = (state: {
  engine: { backgroundState: { SwapsController: SwapsControllerState } };
}) => state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (state: {
  engine: { backgroundState: { SwapsController: SwapsControllerState } };
}) => state.engine.backgroundState.SwapsController.tokens;

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
  selectTokensFromState,
  (swapsTokens: SwapToken[] | undefined, tokens: unknown) => {
    const userTokens = Array.isArray(tokens)
      ? (tokens as unknown[]).filter(isTokenLike)
      : [];

    const values = [...(swapsTokens || []), ...userTokens]
      .filter(isTokenLike)
      .reduce((map: Map<string, SwapToken & { occurrences: number }>, token) => {
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
  selectAllTokensFromState,
  selectSelectedInternalAccountAddressFromState,
  (
    swapsTokens: SwapToken[] | undefined,
    allTokens: unknown,
    currentUserAddress: string | undefined,
  ) => {
    const allTokensArr = Object.values(
      (allTokens ?? {}) as Record<string, unknown>,
    );

    const allUserTokensCrossChains = allTokensArr.reduce<SwapToken[]>(
      (acc, tokensElement) => {
        if (!currentUserAddress) {
          return acc;
        }

        const found =
          (tokensElement as Record<string, unknown>)[currentUserAddress];
        if (!Array.isArray(found)) {
          return acc;
        }

        const flattened = (found as unknown[]).flat() as unknown[];
        return [...acc, ...flattened.filter(isTokenLike)];
      },
      [],
    );

    const values = [...(swapsTokens || []), ...allUserTokensCrossChains]
      .filter(isTokenLike)
      .reduce((map: Map<string, SwapToken & { occurrences: number }>, token) => {
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
  selectTokenListFromState,
  (chainId: string, tokens: SwapToken[], tokenList: unknown) => {
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
  selectTokenListFromState,
  selectContractBalancesFromState,
  (chainId: string, tokens: SwapToken[], tokenList: unknown, balances: unknown) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;

    const tokensAddressesWithBalance = Object.entries(
      balances as Record<string, string | number>,
    )
      .filter(([, balance]) => Number(balance) !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(Number(balanceB), Number(balanceA)) ? -1 : 1,
      )
      .map(([address]) => address.toLowerCase());

    const tokensWithBalance: SwapToken[] = [];
    const originalTokens: SwapToken[] = [];

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
  selectTokenListFromState,
  topAssets,
  (chainId: string, tokens: SwapToken[], tokenList: unknown, topAssets) => {
    if (!topAssets || !tokens) {
      return [];
    }
    const result = (topAssets as { address: string }[])
      .map(({ address }) =>
        tokens.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(isTokenLike);

    return addMetadata(chainId, result, tokenList as Record<string, { name: string }>);
  },
);

// * Reducer
export const initialState: SwapsState & { '0x1': SwapsChainState } = {
  isLive: true, // TODO: should we remove it?
  hasOnboarded: true, // TODO: Once we have updated UI / content for the modal, we should enable it again.

  featureFlags: undefined,
  '0x1': {
    isLive: true,
    featureFlags: undefined,
  },
};

function swapsReducer(state: typeof initialState = initialState, action: SwapsAction) {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const payload = action.payload as
        | { chainId?: ChainId; featureFlags?: FeatureFlags }
        | undefined;

      const rawChainId = payload?.chainId;
      const featureFlags = payload?.featureFlags;

      if (!rawChainId) {
        return state;
      }

      const chainId = getFeatureFlagChainId(rawChainId);

      const data = (state as SwapsState)[chainId] as SwapsChainState | undefined;

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

      const chainFeatureFlags = getChainFeatureFlags(featureFlags, chainId);
      const liveness = getSwapsLiveness(featureFlags, chainId);

      const chain: SwapsChainState = {
        ...data,
        featureFlags: chainFeatureFlags as unknown as SwapsChainFeatureFlags,
        isLive: Boolean(liveness),
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId]: chain,
        featureFlags: {
          smart_transactions: (featureFlags as unknown as Record<string, unknown>).smart_transactions,
          smartTransactions: (featureFlags as unknown as Record<string, unknown>).smartTransactions,
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
