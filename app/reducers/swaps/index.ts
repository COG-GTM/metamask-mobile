/* eslint-disable @typescript-eslint/default-param-last */
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
import { RootState } from '..';

declare const __DEV__: boolean;

interface SwapsToken {
  address: string;
  symbol?: string;
  name?: string;
  decimals: number;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

interface TopAsset {
  address: string;
  [key: string]: unknown;
}

interface ChainState {
  isLive: boolean;
  featureFlags: Record<string, unknown> | undefined;
}

interface FeatureFlagsPayload {
  smart_transactions?: unknown;
  smartTransactions?: unknown;
  [key: string]: unknown;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: Record<string, unknown> | undefined;
  [chainId: string]: unknown;
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
interface SetSwapsLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: { chainId: string; featureFlags: FeatureFlagsPayload | undefined };
}

interface SetSwapsHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SetSwapsLivenessAction | SetSwapsHasOnboardedAction;

export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlagsPayload | undefined,
): SetSwapsLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SetSwapsHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: string,
  tokens: SwapsToken[],
  tokenList: Record<string, { name?: string }>,
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address)];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState) => state.swaps as SwapsState;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainState | undefined)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: string) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainState | undefined)?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState) => {
    const globalFlags = swapsState.featureFlags as
      | Record<string, Record<string, unknown>>
      | undefined;
    const isEnabled = Boolean(
      (globalFlags?.smartTransactions as Record<string, unknown> | undefined)
        ?.mobileActive,
    );
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
  (swapsState, chainId) => {
    const chainData = swapsState[chainId] as ChainState | undefined;
    return {
      ...chainData?.featureFlags,
      smartTransactions: {
        ...((chainData?.featureFlags as Record<string, unknown> | undefined)
          ?.smartTransactions || {}),
        ...((swapsState.featureFlags as Record<string, unknown> | undefined)
          ?.smartTransactions || {}),
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
  (state.engine.backgroundState.SwapsController as Record<string, unknown>)
    .tokens as SwapsToken[] | undefined;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).approvalTransaction,
);
export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).quoteValues,
);
export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).quotes,
);
export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).aggregatorMetadata,
);
export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).error,
);
export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).quoteRefreshSeconds,
);
export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).usedGasEstimate,
);
export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).usedCustomGas,
);
export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).topAggId,
);
export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).pollingCyclesLeft,
);
export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).quotesLastFetched,
);
export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).isInPolling,
);

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens, tokens) => {
    const values = [
      ...((swapsTokens as SwapsToken[]) || []),
      ...((tokens as SwapsToken[]) || []),
    ]
      .filter(Boolean)
      .reduce(
        (
          map: Map<string, SwapsToken>,
          { hasBalanceError, image, ...token }: SwapsToken,
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
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (swapsTokens, allTokens, currentUserAddress) => {
    const allTokensArr = Object.values(
      allTokens as Record<string, Record<string, SwapsToken[]>>,
    );
    const allUserTokensCrossChains = allTokensArr.reduce(
      (acc: SwapsToken[], tokensElement) => {
        const found =
          (tokensElement as Record<string, SwapsToken[]>)[
            currentUserAddress as string
          ] || [];
        return [...acc, ...found.flat()];
      },
      [] as SwapsToken[],
    );
    const values = [
      ...((swapsTokens as SwapsToken[]) || []),
      ...(allUserTokensCrossChains || []),
    ]
      .filter(Boolean)
      .reduce(
        (
          map: Map<string, SwapsToken>,
          { hasBalanceError, image, ...token }: SwapsToken,
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

    return addMetadata(
      chainId,
      tokens,
      tokenList as Record<string, { name?: string }>,
    );
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).topAssets as
      | TopAsset[]
      | undefined,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as Record<string, unknown>).chainCache,
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
    const typedBalances = balances as Record<string, number>;
    const tokensAddressesWithBalance = Object.entries(typedBalances)
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) => (lte(balanceB, balanceA) ? -1 : 1))
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: SwapsToken[] = [];
    const originalTokens: SwapsToken[] = [];

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
    return addMetadata(
      chainId,
      result,
      tokenList as Record<string, { name?: string }>,
    );
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
  (chainId, tokens, tokenList, topAssetsResult) => {
    if (!topAssetsResult || !tokens) {
      return [];
    }
    const result = topAssetsResult
      .map(({ address }: TopAsset) =>
        tokens?.find((token: SwapsToken) =>
          toLowerCaseEquals(token.address, address),
        ),
      )
      .filter(Boolean) as SwapsToken[];
    return addMetadata(
      chainId,
      result,
      tokenList as Record<string, { name?: string }>,
    );
  },
);

// * Reducer
export const initialState: SwapsState = {
  isLive: true,
  hasOnboarded: true,
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

      const data = state[chainId] as ChainState | undefined;

      const chainNoFlags: ChainState = {
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
        featureFlags as Record<string, unknown>,
        chainId as `0x${string}`,
      );
      const liveness = getSwapsLiveness(
        featureFlags as Record<string, unknown>,
        chainId as `0x${string}`,
      );

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
