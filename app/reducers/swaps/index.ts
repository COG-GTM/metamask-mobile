/* eslint-disable @typescript-eslint/default-param-last */
import type { AnyAction } from 'redux';
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';
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

export interface SwapsToken {
  address: string;
  symbol?: string;
  decimals?: number | string;
  name?: string;
  occurrences?: number;
  iconUrl?: string;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

export interface SwapsTopAsset {
  address: string;
  [key: string]: unknown;
}

interface TokenList {
  [address: string]: { name?: string; [key: string]: unknown };
}

export interface SwapsChainState {
  isLive?: boolean;
  featureFlags?: unknown;
}

// SwapsState mixes a few well-known top-level fields with per-chain state
// keyed by hex chain id (e.g. '0x1'). Using `any` for the index value keeps
// chain-key access ergonomic in tests and callers without losing the typing
// of the well-known base fields.
export interface SwapsState {
  isLive?: boolean;
  hasOnboarded?: boolean;
  featureFlags?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [chainId: string]: any;
}

// Minimal state shape used by selectors that only need swaps slice
interface SwapsSliceState {
  swaps: SwapsState;
}

// Minimal state shape used by selectors that only need SwapsController slice
interface SwapsControllerSliceState {
  engine: {
    backgroundState: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SwapsController: any;
    };
  };
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ &&
  allowedTestnetChainIds.includes(chainId as `0x${string}`)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

interface SetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: { chainId: string; featureFlags: FeatureFlags | null | undefined };
}

interface SetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SetLivenessAction | SetHasOnboardedAction;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlags | null | undefined,
): SetLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SetHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: string,
  tokens: SwapsToken[],
  tokenList: TokenList,
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const checksumAddress = safeToChecksumAddress(token.address);
    const tokenMetadata = checksumAddress ? tokenList[checksumAddress] : undefined;
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors

// Wrappers that loosen the input state types so callers (and tests) can
// compose these selectors with narrower state shapes.
const chainIdSelector = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): string => selectEvmChainId(state);

const selectTokensLoose = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): SwapsToken[] | undefined => selectTokens(state) as SwapsToken[] | undefined;

const selectAllTokensLoose = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): unknown => selectAllTokens(state);

const selectSelectedInternalAccountAddressLoose = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): string | undefined => selectSelectedInternalAccountAddress(state);

const selectTokenListLoose = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): TokenList => selectTokenList(state) as TokenList;

const selectContractBalancesLoose = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
): Record<string, unknown> =>
  selectContractBalances(state) as Record<string, unknown>;

const selectEvmChainIdLoose = chainIdSelector;

const swapsStateSelector = (state: SwapsSliceState): SwapsState => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    (swapsState[chainId] as SwapsChainState | undefined)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: SwapsSliceState, chainId: string) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId] as SwapsChainState | undefined)?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState) => {
    const globalFlags = swapsState.featureFlags as
      | { smartTransactions?: { mobileActive?: boolean } }
      | undefined;
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
  (state: any, transactionChainId?: string) =>
    transactionChainId || selectEvmChainId(state),
  (swapsState, chainId) => {
    const chainState = swapsState[chainId] as
      | SwapsChainState
      | undefined;
    const chainFeatureFlags = chainState?.featureFlags as
      | { smartTransactions?: Record<string, unknown> }
      | undefined;
    const globalFeatureFlags = swapsState.featureFlags as
      | { smartTransactions?: Record<string, unknown> }
      | undefined;
    return {
      ...(chainState?.featureFlags as Record<string, unknown> | undefined),
      smartTransactions: {
        ...(chainFeatureFlags?.smartTransactions || {}),
        ...(globalFeatureFlags?.smartTransactions || {}),
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

const selectSwapsControllerState = (state: SwapsControllerSliceState) =>
  state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (
  state: SwapsControllerSliceState,
): SwapsToken[] | undefined =>
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
  selectTokensLoose,
  (swapsTokens, tokens): SwapsToken[] => {
    const values = [...(swapsTokens || []), ...(tokens || [])]
      .filter(Boolean)
      .reduce<Map<string, SwapsToken>>((map, rawToken) => {
        // Strip out hasBalanceError and image from the merged token
        const { hasBalanceError: _hbe, image: _img, ...token } =
          rawToken as SwapsToken;
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
  selectAllTokensLoose,
  selectSelectedInternalAccountAddressLoose,
  (swapsTokens, allTokens, currentUserAddress): SwapsToken[] => {
    const allTokensArr = Object.values(allTokens || {}) as Record<
      string,
      SwapsToken[] | SwapsToken[][]
    >[];
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsToken[]>(
      (acc, tokensElement) => {
        const found =
          (currentUserAddress && tokensElement[currentUserAddress]) || [];
        return [...acc, ...(found as SwapsToken[]).flat()];
      },
      [],
    );
    const values = [
      ...(swapsTokens || []),
      ...(allUserTokensCrossChains || []),
    ]
      .filter(Boolean)
      .reduce<Map<string, SwapsToken>>((map, rawToken) => {
        const { hasBalanceError: _hbe, image: _img, ...token } =
          rawToken as SwapsToken;
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
  selectEvmChainIdLoose,
  swapsControllerAndUserTokens,
  selectTokenListLoose,
  (chainId, tokens, tokenList): SwapsToken[] => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState.topAssets as
    | SwapsTopAsset[]
    | undefined,
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
  (tokens): Record<string, undefined> => {
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
  (tokens): Record<string, undefined> => {
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
  selectTokenListLoose,
  selectContractBalancesLoose,
  (chainId, tokens, tokenList, balances): SwapsToken[] => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances || {})
      .filter(([, balance]) => (balance as unknown) !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(balanceB as never, balanceA as never) ? -1 : 1,
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
    return addMetadata(chainId, result, tokenList as TokenList);
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
  (chainId, tokens, tokenList, topAssetsList): SwapsToken[] => {
    if (!topAssetsList || !tokens) {
      return [];
    }
    const result = topAssetsList
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((token): token is SwapsToken => Boolean(token));
    return addMetadata(chainId, result, tokenList as TokenList);
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
  } as SwapsChainState,
};

function swapsReducer(
  state: SwapsState = initialState,
  action: AnyAction,
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as SwapsChainState | undefined;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

      const chainNoFlags: SwapsChainState = {
        ...(data || { isLive: false, featureFlags: undefined }),
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
        featureFlags,
        chainId as `0x${string}`,
      );
      const liveness = getSwapsLiveness(
        featureFlags,
        chainId as `0x${string}`,
      );

      const chain: SwapsChainState = {
        ...(data || { isLive: false, featureFlags: undefined }),
        featureFlags: chainFeatureFlags,
        isLive: Boolean(liveness),
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId]: chain,
        featureFlags: {
          smart_transactions: (
            featureFlags as unknown as { smart_transactions?: unknown }
          ).smart_transactions,
          smartTransactions: (
            featureFlags as unknown as { smartTransactions?: unknown }
          ).smartTransactions,
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
