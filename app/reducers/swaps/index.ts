/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';
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

export type ChainId = `0x${string}`;

export interface SwapsToken {
  address: string;
  symbol?: string;
  decimals?: number | string;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

interface ChainSwapsData {
  isLive: boolean;
  featureFlags: FeatureFlags[keyof FeatureFlags] | undefined;
}

export interface SwapsGlobalFeatureFlags {
  smart_transactions?: FeatureFlags['smart_transactions'];
  smartTransactions?: FeatureFlags['smartTransactions'];
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: SwapsGlobalFeatureFlags | undefined;
  [chainId: string]: unknown;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: ChainId): ChainId =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? (NETWORKS_CHAIN_ID.MAINNET as ChainId)
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

interface SwapsSetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: { chainId: ChainId; featureFlags: FeatureFlags | null | undefined };
}

interface SwapsSetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SwapsSetLivenessAction | SwapsSetHasOnboardedAction;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlags | null | undefined,
): SwapsSetLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId: chainId as ChainId, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SwapsSetHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

interface TokenListEntry {
  name?: string;
  [key: string]: unknown;
}

function addMetadata(
  chainId: ChainId,
  tokens: SwapsToken[],
  tokenList: Record<string, TokenListEntry>,
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const checksum = safeToChecksumAddress(token.address);
    const tokenMetadata = checksum ? tokenList[checksum] : undefined;
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
// TODO: Replace "any" with the RootState type once it is fully typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swapsStateSelector = (state: any): SwapsState => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainSwapsData | undefined)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state, chainId: ChainId) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainSwapsData | undefined)?.isLive || false,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_state: any, transactionChainId?: ChainId) =>
    transactionChainId || selectEvmChainId(_state),
  // The shape of feature flags is loose at runtime (mixed per-chain and
  // global flags) and downstream consumers expect a structurally compatible
  // object whose typing differs from any single library type, so mirror the
  // original untyped behaviour.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState, chainId): any => {
    const chainData = swapsState[chainId] as ChainSwapsData;
    const chainFeatureFlags =
      (chainData.featureFlags as Record<string, unknown> | undefined) || {};
    return {
      ...chainFeatureFlags,
      smartTransactions: {
        ...((chainFeatureFlags.smartTransactions as
          | Record<string, unknown>
          | undefined) || {}),
        ...((swapsState.featureFlags?.smartTransactions as
          | Record<string, unknown>
          | undefined) || {}),
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

// TODO: Replace "any" with the RootState type once it is fully typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectSwapsControllerState = (state: any) =>
  state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swapsControllerTokens = (state: any): SwapsToken[] | undefined =>
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
    const values = [
      ...((swapsTokens as SwapsToken[] | undefined) || []),
      ...((tokens as SwapsToken[] | undefined) || []),
    ]
      .filter(Boolean)
      .reduce((map, swapsToken) => {
        const { hasBalanceError, image, ...token } = swapsToken;
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
    const allTokensArr = Object.values(
      (allTokens as Record<string, Record<string, SwapsToken[]>>) || {},
    );
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsToken[]>(
      (acc, tokensElement) => {
        const found =
          (currentUserAddress && tokensElement[currentUserAddress]) || [];
        return [...acc, ...(found as SwapsToken[]).flat()];
      },
      [],
    );
    const values = [
      ...((swapsTokens as SwapsToken[] | undefined) || []),
      ...allUserTokensCrossChains,
    ]
      .filter(Boolean)
      .reduce((map, swapsToken) => {
        const { hasBalanceError, image, ...token } = swapsToken;
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

    return addMetadata(
      chainId as ChainId,
      tokens as SwapsToken[],
      tokenList as Record<string, TokenListEntry>,
    );
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
    const baseTokens = tokens as SwapsToken[];
    const tokensAddressesWithBalance = Object.entries(
      (balances as unknown as Record<string, number>) || {},
    )
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) => (lte(balanceB, balanceA) ? -1 : 1))
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
    return addMetadata(
      chainId as ChainId,
      result,
      tokenList as Record<string, TokenListEntry>,
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
  (chainId, tokens, tokenList, topAssetsList) => {
    if (!topAssetsList || !tokens) {
      return [];
    }
    const result = (topAssetsList as { address: string }[])
      .map(
        ({ address }) =>
          (tokens as SwapsToken[]).find((token) =>
            toLowerCaseEquals(token.address, address),
          ) as SwapsToken | undefined,
      )
      .filter((token): token is SwapsToken => Boolean(token));
    return addMetadata(
      chainId as ChainId,
      result,
      tokenList as Record<string, TokenListEntry>,
    );
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

      const data = state[chainId] as ChainSwapsData | undefined;

      const chainNoFlags: ChainSwapsData = {
        ...(data || ({ isLive: false, featureFlags: undefined } as ChainSwapsData)),
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

      const chain: ChainSwapsData = {
        ...(data || ({} as ChainSwapsData)),
        featureFlags: chainFeatureFlags,
        isLive: Boolean(liveness),
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
