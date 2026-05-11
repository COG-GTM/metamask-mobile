/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import type {
  FeatureFlags,
  SwapsControllerState as ExternalSwapsControllerState,
} from '@metamask/swaps-controller/dist/types';
import { Hex } from '@metamask/utils';
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

interface SwapsToken {
  address: string;
  decimals: number | string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  name?: string;
  [key: string]: unknown;
}

interface SwapsChainState {
  isLive: boolean;
  featureFlags?: unknown;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: {
    smart_transactions?: unknown;
    smartTransactions?: unknown;
  };
  [chainId: string]: unknown;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: Hex): Hex =>
  __DEV__ && (allowedTestnetChainIds as Hex[]).includes(chainId)
    ? (NETWORKS_CHAIN_ID.MAINNET as Hex)
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS' as const;
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED' as const;
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
// chainId is intentionally widened to `string | Hex` to match existing call
// sites in `app/components/UI/Swaps/SwapsLiveness.ts`. The reducer narrows to
// `Hex` internally.
export const setSwapsLiveness = (
  chainId: string | Hex,
  featureFlags?: FeatureFlags | null,
) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId: chainId as Hex, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

export type SwapsAction =
  | {
      type: typeof SWAPS_SET_LIVENESS;
      // Accept loose feature-flag shapes from action creators and tests.
      // The reducer narrows to `FeatureFlags` at the call site.
      payload: { chainId: Hex; featureFlags?: unknown };
    }
  | { type: typeof SWAPS_SET_HAS_ONBOARDED; payload: boolean };

// * Functions

function addMetadata(
  chainId: Hex,
  tokens: SwapsToken[],
  tokenList: Record<string, { name?: string } | undefined>,
): SwapsToken[] {
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
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState): SwapsState =>
  state.swaps as unknown as SwapsState;
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
  [swapsStateSelector, (_state: RootState, chainId: Hex) => chainId],
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

// Loose representation of the chain-feature-flag result so existing callers
// (mocks that return `{}`, components that read `smartTransactions.expectedDeadline`,
// and the strict `SubmitSmartTransactionRequest['featureFlags']` shape in
// `app/util/smart-transactions/smart-publish-hook.ts`) all continue to type-check.
export interface SwapsChainFeatureFlagsResult {
  mobile_active?: boolean;
  extension_active?: boolean;
  fallback_to_v1?: boolean;
  fallbackToV1?: boolean;
  mobileActive?: boolean;
  extensionActive?: boolean;
  mobileActiveIOS?: boolean;
  mobileActiveAndroid?: boolean;
  smartTransactions?: {
    expectedDeadline?: number;
    maxDeadline?: number;
    mobileReturnTxHashAsap?: boolean;
    batchStatusPollingInterval?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Returns the swaps feature flags
 */
export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  (_state: RootState, transactionChainId?: Hex) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId): SwapsChainFeatureFlagsResult => {
    // Intentionally cast without `| undefined` to preserve the original
    // throw-on-missing-entry behavior verified by the swaps reducer tests.
    const chainEntry = swapsState[chainId] as {
      featureFlags?: SwapsChainFeatureFlagsResult;
    };
    const globalFeatureFlags = swapsState.featureFlags as
      | {
          smartTransactions?: SwapsChainFeatureFlagsResult['smartTransactions'];
        }
      | undefined;
    return {
      ...(chainEntry.featureFlags || {}),
      smartTransactions: {
        ...(chainEntry.featureFlags?.smartTransactions || {}),
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

const selectSwapsControllerState = (
  state: RootState,
): ExternalSwapsControllerState =>
  (
    state.engine.backgroundState as unknown as {
      SwapsController: ExternalSwapsControllerState;
    }
  ).SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (
  state: RootState,
): ExternalSwapsControllerState['tokens'] =>
  (
    state.engine.backgroundState as unknown as {
      SwapsController: ExternalSwapsControllerState;
    }
  ).SwapsController.tokens;

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
    const values = [...(swapsTokens || []), ...((tokens as SwapsToken[]) || [])]
      .filter(Boolean)
      .reduce(
        (
          map: Map<string, SwapsToken>,
          { hasBalanceError, image, ...token }: SwapsToken,
        ) => {
          const key = (token.address as string).toLowerCase();

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
        const found = (currentUserAddress &&
          tokensElement[currentUserAddress]) || [];
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
          const key = (token.address as string).toLowerCase();

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
      chainId as Hex,
      tokens,
      tokenList as Record<string, { name?: string } | undefined>,
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
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(
      balances as Record<string, unknown>,
    )
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
    return addMetadata(
      chainId as Hex,
      result,
      tokenList as Record<string, { name?: string } | undefined>,
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
    const result = topAssetsList
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((token): token is SwapsToken => Boolean(token));
    return addMetadata(
      chainId as Hex,
      result,
      tokenList as Record<string, { name?: string } | undefined>,
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

      const data = state[chainId] as SwapsChainState | undefined;

      const chainNoFlags: SwapsChainState = {
        ...(data || { isLive: false }),
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

      const chain: SwapsChainState = {
        ...(data || { isLive: false }),
        featureFlags: chainFeatureFlags,
        isLive: liveness as boolean,
      };

      return {
        ...state,
        [chainId]: chain,
        [rawChainId]: chain,
        featureFlags: {
          smart_transactions: (featureFlags as { smart_transactions?: unknown })
            .smart_transactions,
          smartTransactions: (featureFlags as { smartTransactions?: unknown })
            .smartTransactions,
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
