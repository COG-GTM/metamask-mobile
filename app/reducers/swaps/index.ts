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
import type {
  ChainCache,
  FeatureFlags,
  TxParams,
} from '@metamask/swaps-controller/dist/types';
import type { Hex } from '@metamask/utils';
import type { RootState } from '..';

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export interface SwapsChainState {
  isLive?: boolean;
  featureFlags?: SwapsFeatureFlags;
  [key: string]: unknown;
}

interface SwapsFeatureFlags {
  smart_transactions?: Record<string, unknown>;
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SwapsSelectedFeatureFlags {
  mobile_active: boolean;
  extension_active: boolean;
  fallback_to_v1: boolean;
  fallbackToV1: boolean;
  mobileActive: boolean;
  extensionActive: boolean;
  mobileActiveIOS: boolean;
  mobileActiveAndroid: boolean;
  smartTransactions: {
    expectedDeadline: number;
    maxDeadline: number;
    mobileReturnTxHashAsap: boolean;
    batchStatusPollingInterval: number;
  };
}

export interface SwapsState {
  isLive?: boolean;
  hasOnboarded?: boolean;
  featureFlags?: SwapsFeatureFlags;
  [chainId: `0x${string}`]: SwapsChainState;
}

interface SwapsAction {
  type: string | null;
  payload?: {
    chainId: string;
    featureFlags?: SwapsFeatureFlags | null;
  } | boolean;
}

export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ && allowedTestnetChainIds.includes(chainId as Hex)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlags | null | undefined,
) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

interface SwapToken {
  address: string;
  [key: string]: unknown;
}

interface TokenMetadata {
  name?: string;
}

function addMetadata(
  chainId: string,
  tokens: SwapToken[],
  tokenList: Record<string, TokenMetadata>,
) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata =
      tokenList[safeToChecksumAddress(token.address) as string];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = (state: unknown) =>
  selectEvmChainId(state as RootState);
const allTokensSelector = (state: unknown) =>
  selectAllTokens(state as RootState);
const tokensSelector = (state: unknown) => selectTokens(state as RootState);
const tokenListSelector = (state: unknown) => selectTokenList(state as RootState);
const contractBalancesSelector = (state: unknown) =>
  selectContractBalances(state as RootState);
const selectedAddressSelector = (state: unknown) =>
  selectSelectedInternalAccountAddress(state as RootState);
const swapsStateSelector = (state: unknown) =>
  (state as { swaps: SwapsState }).swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    Boolean(swapsState[chainId as Hex]?.isLive),
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state, chainId) => chainId],
  (swapsState, chainId) =>
    Boolean(swapsState[chainId as Hex]?.isLive),
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState: SwapsState) => {
    const globalFlags = swapsState.featureFlags;
    const isEnabled = Boolean(globalFlags?.smartTransactions?.mobileActive);
    return isEnabled;
  },
);

/**
 * Returns the swaps feature flags
 */
export const selectSwapsChainFeatureFlags = createSelector(
  [
    swapsStateSelector,
    (_state: unknown, transactionChainId?: string) =>
      transactionChainId || selectEvmChainId(_state as RootState),
  ],
  (swapsState: unknown, chainId: string): SwapsSelectedFeatureFlags => {
    const typedSwapsState = swapsState as SwapsState;
    return {
      ...typedSwapsState[chainId as Hex].featureFlags,
      smartTransactions: {
        ...(typedSwapsState[chainId as Hex].featureFlags?.smartTransactions ||
          {}),
        ...(typedSwapsState.featureFlags?.smartTransactions || {}),
      },
    } as unknown as SwapsSelectedFeatureFlags;
  },
);

/**
 * Returns the swaps onboarded state
 */

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.hasOnboarded,
);

interface SwapsControllerState {
  approvalTransaction?: TxParams | null;
  quoteValues?: unknown;
  quotes?: unknown;
  aggregatorMetadata?: unknown;
  error?: unknown;
  quoteRefreshSeconds?: number;
  usedGasEstimate?: unknown;
  usedCustomGas?: boolean;
  topAggId?: string;
  pollingCyclesLeft?: number;
  quotesLastFetched?: number;
  isInPolling?: boolean;
  tokens?: SwapToken[];
  topAssets?: SwapToken[];
  chainCache?: ChainCache;
}

const selectSwapsControllerState = (state: unknown) =>
  (state as {
    engine: { backgroundState: { SwapsController: SwapsControllerState } };
  }).engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (state: unknown) =>
  (state as {
    engine: { backgroundState: { SwapsController: SwapsControllerState } };
  }).engine.backgroundState.SwapsController.tokens;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    swapsControllerState.approvalTransaction as TxParams | null,
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
  tokensSelector,
  (swapsTokens, tokens) => {
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
      }, new Map())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  allTokensSelector,
  selectedAddressSelector,
  (swapsTokens, allTokens, currentUserAddress) => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce<SwapToken[]>(
      (acc, tokensElement) => {
        const found = tokensElement[currentUserAddress as string] || [];
        return [...acc, ...(found.flat() as SwapToken[])];
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
      }, new Map())
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  tokenListSelector,
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
  (swapsControllerState) => swapsControllerState.chainCache as ChainCache,
);

/**
 * Returns a memoized object that only has the addesses of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
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

/**
 * Returns a memoized object that only has the addresses cross chains of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
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

/**
 * Returns an array of tokens to display by default on the selector modal
 * based on the current account's balances.
 */
export const swapsTokensWithBalanceSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  tokenListSelector,
  contractBalancesSelector,
  (chainId, tokens, tokenList, balances) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(
      balances as unknown as Record<string, number>,
    )
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(balanceB, balanceA) ? -1 : 1,
      )
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance = [];
    const originalTokens = [];

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
  tokenListSelector,
  topAssets,
  (chainId, tokens, tokenList, assets) => {
    if (!assets || !tokens) {
      return [];
    }
    const result = assets
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean);
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
      const { chainId: rawChainId, featureFlags } = action.payload as {
        chainId: string;
        featureFlags?: SwapsFeatureFlags;
      };
      const chainId = getFeatureFlagChainId(rawChainId) as Hex;

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
        featureFlags as FeatureFlags,
        chainId,
      );
      const liveness = getSwapsLiveness(
        featureFlags as FeatureFlags,
        chainId,
      );

      const chain = {
        ...data,
        featureFlags: chainFeatureFlags,
        isLive: liveness,
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId as Hex]: chain,
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
