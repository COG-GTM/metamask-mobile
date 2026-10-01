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

interface SwapToken {
  address: string;
  symbol?: string;
  decimals?: number | string;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

interface TopAsset {
  address: string;
}

interface FeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ChainSwapState {
  isLive: boolean;
  featureFlags: FeatureFlags | undefined;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: FeatureFlags | undefined;
  [chainId: string]: boolean | FeatureFlags | undefined | ChainSwapState;
}

export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlags | null,
): { type: typeof SWAPS_SET_LIVENESS; payload: { chainId: string; featureFlags: FeatureFlags | null } } => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): { type: typeof SWAPS_SET_HAS_ONBOARDED; payload: boolean } => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: string,
  tokens: SwapToken[],
  tokenList: Record<string, { name?: string }>,
): SwapToken[] {
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
const swapsStateSelector = (state: RootState) => state.swaps;

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState: Record<string, unknown>, chainId: string) =>
    (swapsState[chainId] as ChainSwapState)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: string) => chainId],
  (swapsState: Record<string, unknown>, chainId: string) =>
    (swapsState[chainId] as ChainSwapState)?.isLive || false,
);

export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState: Record<string, unknown>) => {
    const globalFlags = swapsState.featureFlags as FeatureFlags | undefined;
    const isEnabled = Boolean(
      (globalFlags?.smartTransactions as Record<string, unknown> | undefined)
        ?.mobileActive,
    );
    return isEnabled;
  },
);

export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  (_state: RootState, transactionChainId: string | undefined) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState: Record<string, unknown>, chainId: string) => ({
    ...(swapsState[chainId] as ChainSwapState).featureFlags,
    smartTransactions: {
      ...((swapsState[chainId] as ChainSwapState).featureFlags
        ?.smartTransactions || {}),
      ...((swapsState.featureFlags as FeatureFlags | undefined)
        ?.smartTransactions || {}),
    },
  }),
);

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState: Record<string, unknown>) => swapsState.hasOnboarded,
);

const selectSwapsControllerState = (state: RootState) =>
  state.engine.backgroundState.SwapsController;

export const swapsControllerTokens = (state: RootState) =>
  state.engine.backgroundState.SwapsController.tokens;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.approvalTransaction,
);
export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.quoteValues,
);
export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.quotes,
);
export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.aggregatorMetadata,
);
export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.error,
);
export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.quoteRefreshSeconds,
);
export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.usedGasEstimate,
);
export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.usedCustomGas,
);
export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.topAggId,
);
export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.pollingCyclesLeft,
);
export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.quotesLastFetched,
);
export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.isInPolling,
);

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens: SwapToken[], tokens: SwapToken[]) => {
    const values = [...(swapsTokens || []), ...(tokens || [])]
      .filter(Boolean)
      .reduce(
        (
          map: Map<string, SwapToken>,
          { hasBalanceError, image, ...token }: SwapToken,
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
        new Map<string, SwapToken>(),
      )
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (
    swapsTokens: SwapToken[],
    allTokens: Record<string, Record<string, SwapToken[]>>,
    currentUserAddress: string,
  ) => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce(
      (acc: SwapToken[], tokensElement: Record<string, SwapToken[]>) => {
        const found = tokensElement[currentUserAddress] || [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const values = [
      ...(swapsTokens || []),
      ...(allUserTokensCrossChains || []),
    ]
      .filter(Boolean)
      .reduce(
        (
          map: Map<string, SwapToken>,
          { hasBalanceError, image, ...token }: SwapToken,
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
        new Map<string, SwapToken>(),
      )
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  (
    chainId: string,
    tokens: SwapToken[],
    tokenList: Record<string, { name?: string }>,
  ) => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.topAssets as TopAsset[],
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: Record<string, unknown>) =>
    swapsControllerState.chainCache,
);

export const swapsTokensObjectSelector = createSelector(
  swapsControllerAndUserTokens,
  (tokens: SwapToken[]) => {
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

export const swapsTokensMultiChainObjectSelector = createSelector(
  swapsControllerAndUserTokensMultichain,
  (tokens: SwapToken[]) => {
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

export const swapsTokensWithBalanceSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  selectContractBalances,
  (
    chainId: string,
    tokens: SwapToken[],
    tokenList: Record<string, { name?: string }>,
    balances: Record<string, number>,
  ) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) => (lte(balanceB, balanceA) ? -1 : 1))
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
    return addMetadata(chainId, result, tokenList);
  },
);

export const swapsTopAssetsSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  topAssets,
  (
    chainId: string,
    tokens: SwapToken[],
    tokenList: Record<string, { name?: string }>,
    topAssetsData: TopAsset[],
  ) => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = topAssetsData
      .map(({ address }: TopAsset) =>
        tokens?.find((token: SwapToken) =>
          toLowerCaseEquals(token.address, address),
        ),
      )
      .filter(Boolean) as SwapToken[];
    return addMetadata(chainId, result, tokenList);
  },
);

// * Reducer
export const initialState: Record<string, unknown> = {
  isLive: true,
  hasOnboarded: true,

  featureFlags: undefined,
  '0x1': {
    isLive: true,
    featureFlags: undefined,
  },
};

interface SwapsAction {
  type: string;
  payload?: {
    chainId?: string;
    featureFlags?: FeatureFlags | null;
  } | boolean;
}

function swapsReducer(
  state: Record<string, unknown> = initialState,
  action: SwapsAction,
): Record<string, unknown> {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const payload = action.payload as {
        chainId: string;
        featureFlags: FeatureFlags | null;
      };
      const { chainId: rawChainId, featureFlags } = payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as ChainSwapState | undefined;

      const chainNoFlags: ChainSwapState = {
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

      const chain: ChainSwapState = {
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
