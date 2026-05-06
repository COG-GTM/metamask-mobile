/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';
import type { SwapsControllerState } from '@metamask/swaps-controller';
import type { RootState } from '..';
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
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

export interface SwapsChainState {
  isLive?: boolean;
  featureFlags?: unknown;
}

export interface SwapsBaseState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: {
    smart_transactions?: unknown;
    smartTransactions?: { mobileActive?: boolean; [key: string]: unknown };
    [key: string]: unknown;
  };
}

export type SwapsState = SwapsBaseState & {
  [chainId: `0x${string}`]: SwapsChainState | undefined;
};

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ &&
  (allowedTestnetChainIds as readonly string[]).includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

interface SetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: { chainId: string; featureFlags: unknown };
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
  payload: { chainId, featureFlags: featureFlags as unknown },
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
  tokenList: Record<string, { name?: string }>,
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
// Using `unknown` for the state arg keeps backwards compatibility with
// consumers (typed via `useSelector`) that previously inferred `any` from the
// untyped JS source.
const swapsStateSelector = (state: unknown): SwapsState =>
  (state as { swaps: SwapsState }).swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    (swapsState[chainId as `0x${string}`] as SwapsChainState | undefined)
      ?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: string) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId as `0x${string}`] as SwapsChainState | undefined)
      ?.isLive || false,
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
export interface SwapsChainFeatureFlags {
  mobile_active: boolean;
  extension_active: boolean;
  fallback_to_v1: boolean;
  fallbackToV1: boolean;
  mobileActive: boolean;
  extensionActive: boolean;
  mobileActiveIOS: boolean;
  mobileActiveAndroid: boolean;
  smartTransactions:
    | {
        expectedDeadline: number;
        maxDeadline: number;
        mobileReturnTxHashAsap: boolean;
        batchStatusPollingInterval: number;
      }
    | Record<string, never>;
}

export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  (state: RootState, transactionChainId?: string) =>
    transactionChainId || selectEvmChainId(state),
  (swapsState, chainId): SwapsChainFeatureFlags => {
    const chainState = swapsState[chainId as `0x${string}`] as SwapsChainState;
    const chainFeatureFlags = chainState.featureFlags as Record<
      string,
      unknown
    > & { smartTransactions?: Record<string, unknown> };
    return {
      ...chainFeatureFlags,
      smartTransactions: {
        ...(chainFeatureFlags?.smartTransactions || {}),
        ...((swapsState.featureFlags?.smartTransactions as
          | Record<string, unknown>
          | undefined) || {}),
      },
    } as unknown as SwapsChainFeatureFlags;
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
export const swapsControllerTokens = (
  state: RootState,
): SwapsToken[] | undefined =>
  state.engine.backgroundState.SwapsController.tokens as
    | SwapsToken[]
    | undefined;

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
    const values = [...(swapsTokens || []), ...(tokens || [])]
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
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsToken[]>(
      (acc, tokensElement) => {
        const found = currentUserAddress
          ? tokensElement[currentUserAddress] || []
          : [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const values = [...(swapsTokens || []), ...(allUserTokensCrossChains || [])]
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
  (swapsControllerState) => swapsControllerState.topAssets,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) =>
    (swapsControllerState as unknown as SwapsControllerState).chainCache,
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
    const tokensAddressesWithBalance = Object.entries(
      balances as Record<string, unknown>,
    )
      .filter(([, balance]) => Number(balance) !== 0)
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
  (chainId, tokens, tokenList, currentTopAssets) => {
    const topAssetsArr = currentTopAssets as
      | { address: string }[]
      | undefined;
    if (!topAssetsArr || !tokens) {
      return [];
    }
    const result = topAssetsArr
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((value): value is SwapsToken => Boolean(value));
    return addMetadata(
      chainId,
      result,
      tokenList as Record<string, { name?: string }>,
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

      const data = state[chainId as `0x${string}`] as
        | SwapsChainState
        | undefined;

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

      const chainFeatureFlags = getChainFeatureFlags(
        featureFlags as FeatureFlags,
        chainId as `0x${string}`,
      );
      const liveness = getSwapsLiveness(
        featureFlags as FeatureFlags,
        chainId as `0x${string}`,
      );

      const chain: SwapsChainState = {
        ...data,
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
            featureFlags as unknown as {
              smartTransactions?: {
                mobileActive?: boolean;
                [key: string]: unknown;
              };
            }
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
