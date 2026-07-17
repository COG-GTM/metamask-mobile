/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import { FeatureFlags } from '@metamask/swaps-controller/dist/types';
import { Hex } from '@metamask/utils';
import { isMainnetByChainId } from '../../util/networks';
import { safeToChecksumAddress } from '../../util/address';
import { toLowerCaseEquals } from '../../util/general';
import { lte } from '../../util/lodash';
import { selectEvmChainId } from '../../selectors/networkController';
import { selectAllTokens, selectTokens } from '../../selectors/tokensController';
import { selectTokenList } from '../../selectors/tokenListController';
import { selectContractBalances } from '../../selectors/tokenBalancesController';
import { getChainFeatureFlags, getSwapsLiveness } from './utils';
import { allowedTestnetChainIds } from '../../components/UI/Swaps/utils';
import { NETWORKS_CHAIN_ID } from '../../constants/network';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { RootState } from '..';

/**
 * A loosely-typed token as processed by the swaps selectors. Tokens flow in
 * from several controllers with slightly different shapes, so only the fields
 * read here are declared and arbitrary extra fields are allowed.
 */
interface SwapsTokenLike {
  address: string;
  decimals?: number | string;
  hasBalanceError?: boolean;
  image?: string;
  occurrences?: number;
  name?: string;
  [key: string]: unknown;
}

/**
 * Global (chain-agnostic) swaps feature flags kept in state.
 */
export type SwapsGlobalFeatureFlags = Pick<
  FeatureFlags,
  'smart_transactions' | 'smartTransactions'
>;

/**
 * The shape returned by {@link selectSwapsChainFeatureFlags}. It merges the
 * per-chain swaps feature flags with the global `smartTransactions` flags. The
 * concrete flag objects flowing in from the swaps controller vary slightly
 * between chains and versions, so only the fields consumers read are declared
 * and arbitrary extra fields are permitted.
 */
export interface SwapsChainFeatureFlags {
  smartTransactions?: {
    mobileReturnTxHashAsap?: boolean;
    extensionReturnTxHashAsap?: boolean;
    expectedDeadline?: number;
    maxDeadline?: number;
    batchStatusPollingInterval?: number;
    mobileActive?: boolean;
    extensionActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Per-chain swaps state keyed by chain id in the swaps state object.
 */
export interface SwapsChainState {
  isLive: ReturnType<typeof getSwapsLiveness>;
  featureFlags?: ReturnType<typeof getChainFeatureFlags>;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: SwapsGlobalFeatureFlags;
  [chainId: `0x${string}`]: SwapsChainState | undefined;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: Hex): Hex =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS' as const;
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED' as const;
const MAX_TOKENS_WITH_BALANCE = 5;

interface SetSwapsLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: Hex;
    featureFlags?: FeatureFlags | null;
  };
}

interface SetSwapsHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

export type SwapsAction = SetSwapsLivenessAction | SetSwapsHasOnboardedAction;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags?: FeatureFlags | null,
): SetSwapsLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId: chainId as Hex, featureFlags },
});
export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SetSwapsHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: Hex,
  tokens: SwapsTokenLike[],
  tokenList: ReturnType<typeof selectTokenList>,
): SwapsTokenLike[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const checksumAddress = safeToChecksumAddress(token.address);
    const tokenMetadata = checksumAddress
      ? tokenList[checksumAddress]
      : undefined;
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState): SwapsState => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => swapsState[chainId]?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: Hex) => chainId],
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
  (_state: RootState, transactionChainId?: Hex) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId): SwapsChainFeatureFlags => {
    const chainState = swapsState[chainId] as SwapsChainState;
    return {
      ...chainState.featureFlags,
      smartTransactions: {
        ...(chainState.featureFlags?.smartTransactions || {}),
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
    const combinedTokens: SwapsTokenLike[] = [
      ...(swapsTokens || []),
      ...(tokens || []),
    ].filter(Boolean) as SwapsTokenLike[];
    const values = combinedTokens
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
      }, new Map<string, SwapsTokenLike>())
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
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsTokenLike[]>(
      (acc, tokensElement) => {
        const found = currentUserAddress
          ? tokensElement[currentUserAddress] || []
          : [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const combinedTokens: SwapsTokenLike[] = [
      ...(swapsTokens || []),
      ...(allUserTokensCrossChains || []),
    ].filter(Boolean) as SwapsTokenLike[];
    const values = combinedTokens
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
      }, new Map<string, SwapsTokenLike>())
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
    const tokensWithBalance: SwapsTokenLike[] = [];
    const originalTokens: SwapsTokenLike[] = [];

    for (const token of baseTokens) {
      if (tokensAddressesWithBalance.includes(token.address)) {
        tokensWithBalance.push(token);
      } else {
        originalTokens.push(token);
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
  (chainId, tokens, tokenList, topAssetsList) => {
    if (!topAssetsList || !tokens) {
      return [];
    }
    const result = topAssetsList
      .map(({ address }: { address: string }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean) as SwapsTokenLike[];
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

      const data = state[chainId];

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
