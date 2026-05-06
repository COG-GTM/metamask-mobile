import { AnyAction } from 'redux';
import { createSelector } from 'reselect';
import type {
  FeatureFlags,
  GlobalFeatureFlags,
  SwapsControllerState as MetaMaskSwapsControllerState,
} from '@metamask/swaps-controller/dist/types';
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
  decimals: number;
  symbol?: string;
  name?: string;
  occurrences?: number;
  iconUrl?: string;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

export interface SwapsChainState {
  isLive?: boolean;
  // The stored feature flags for a chain are derived from the swaps API response
  // and validated at the API layer, not here. Test fixtures include extra/legacy
  // fields, so we keep the persisted shape permissive (callers narrow on access).
  featureFlags?: Record<string, unknown>;
}

export type SwapsState = {
  // Top-level fields are populated by the reducer. They are typed as optional
  // here to keep the published state shape compatible with sparse test fixtures
  // that initialise the slice without the full set of fields.
  isLive?: boolean;
  hasOnboarded?: boolean;
  featureFlags?: GlobalFeatureFlags;
} & {
  // Chain-keyed entries (e.g. '0x1') always resolve to chain state
  [chainId: `0x${string}`]: SwapsChainState;
};

// The persisted SwapsController slice mirrors the upstream controller state.
type SwapsControllerState = MetaMaskSwapsControllerState;

// SwapsRootState mirrors the persisted-state shape this slice cares about.
// We intentionally mark fields optional / use `unknown` index entries so that
// test fixtures (which often omit unrelated slices) and the global RootState
// (where `swaps: any`) both satisfy this constraint, keeping cross-slice
// selectors compatible without forcing callers to widen their state type.
interface SwapsRootState {
  swaps?: Record<string, unknown>;
  engine: {
    backgroundState: Record<string, unknown>;
  };
}

export type SwapsAction =
  | {
      type: typeof SWAPS_SET_LIVENESS;
      payload: { chainId: ChainId; featureFlags?: FeatureFlags };
    }
  | {
      type: typeof SWAPS_SET_HAS_ONBOARDED;
      payload: boolean;
    };

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: ChainId): ChainId =>
  __DEV__ && (allowedTestnetChainIds as readonly string[]).includes(chainId)
    ? (NETWORKS_CHAIN_ID.MAINNET as ChainId)
    : chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags?: FeatureFlags | null,
): SwapsAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId: chainId as ChainId, featureFlags: featureFlags ?? undefined },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean): SwapsAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: ChainId,
  tokens: SwapsToken[],
  tokenList: Record<string, { name?: string }> | { name?: string }[],
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = (
      tokenList as Record<string, { name?: string } | undefined>
    )[safeToChecksumAddress(token.address) ?? ''];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
// The foreign selectors below are typed against the global RootState. We accept
// the wider SwapsRootState (which includes everything we care about) and forward
// to them via casts so test fixtures can pass partial root states.
type ForeignSelector<T> = (state: SwapsRootState) => T;

const chainIdSelector: ForeignSelector<ReturnType<typeof selectEvmChainId>> = (
  state,
) => selectEvmChainId(state as unknown as Parameters<typeof selectEvmChainId>[0]);
const tokensSelector: ForeignSelector<ReturnType<typeof selectTokens>> = (
  state,
) => selectTokens(state as unknown as Parameters<typeof selectTokens>[0]);
const allTokensSelector: ForeignSelector<ReturnType<typeof selectAllTokens>> = (
  state,
) => selectAllTokens(state as unknown as Parameters<typeof selectAllTokens>[0]);
const tokenListSelector: ForeignSelector<ReturnType<typeof selectTokenList>> = (
  state,
) => selectTokenList(state as unknown as Parameters<typeof selectTokenList>[0]);
const contractBalancesSelector: ForeignSelector<
  ReturnType<typeof selectContractBalances>
> = (state) =>
  selectContractBalances(
    state as unknown as Parameters<typeof selectContractBalances>[0],
  );
const selectedInternalAccountAddressSelector: ForeignSelector<
  ReturnType<typeof selectSelectedInternalAccountAddress>
> = (state) =>
  selectSelectedInternalAccountAddress(
    state as unknown as Parameters<typeof selectSelectedInternalAccountAddress>[0],
  );

const swapsStateSelector = (state: SwapsRootState): SwapsState =>
  state.swaps as SwapsState;
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
  [swapsStateSelector, (_state: SwapsRootState, chainId: ChainId) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId] as SwapsChainState | undefined)?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
// `swapsSmartTxFlagEnabled` is composed by foreign selectors (notably
// `selectShouldUseSmartTransaction` in `selectors/smartTransactionsController`)
// whose existing call sites — including `useSelector(state => …)` callbacks —
// rely on the legacy untyped contract this reducer provided when it was JS.
// Typing the state strictly here would propagate `RootState` requirements out
// to those untyped callers and surface unrelated errors (`unknown` is not
// assignable to `RootState`). We deliberately use `any` to preserve the
// public contract and avoid touching consumer code in this conversion PR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swapsSmartTxFlagEnabled = (state: any): boolean => {
  const swapsState = state?.swaps as SwapsState | undefined;
  const isEnabled = Boolean(
    swapsState?.featureFlags?.smartTransactions?.mobileActive,
  );
  return isEnabled;
};

/**
 * Returns the swaps feature flags
 */
export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  (state: SwapsRootState, transactionChainId?: ChainId) =>
    transactionChainId || (chainIdSelector(state) as ChainId),
  // The runtime value satisfies several structurally-incompatible consumer
  // types (@metamask/swaps-controller FeatureFlags, smart-transactions-controller
  // FeatureFlags, and smart-publish-hook's inline interface) because the API
  // returns all the fields those consumers read. Pre-conversion JS exported
  // `any`; we preserve that contract with an explicit `any` here so as not to
  // break the wider type graph.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState, chainId): any => {
    const chainEntry = swapsState[chainId] as SwapsChainState | undefined;
    const chainFlags = (chainEntry?.featureFlags ?? {}) as Record<
      string,
      unknown
    > & {
      smartTransactions?: Record<string, unknown>;
    };
    return {
      ...chainFlags,
      smartTransactions: {
        ...(chainFlags.smartTransactions || {}),
        ...((swapsState.featureFlags?.smartTransactions as Record<
          string,
          unknown
        >) || {}),
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
  state: SwapsRootState,
): SwapsControllerState =>
  state.engine.backgroundState.SwapsController as SwapsControllerState;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (
  state: SwapsRootState,
): SwapsToken[] | undefined =>
  (state.engine.backgroundState.SwapsController as SwapsControllerState | undefined)
    ?.tokens ?? undefined;

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
  tokensSelector,
  (swapsTokens, tokens): SwapsToken[] => {
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
  allTokensSelector,
  selectedInternalAccountAddressSelector,
  (swapsTokens, allTokens, currentUserAddress): SwapsToken[] => {
    const allTokensArr = Object.values(allTokens || {});
    const allUserTokensCrossChains = allTokensArr.reduce<SwapsToken[]>(
      (acc, tokensElement) => {
        const found =
          (currentUserAddress &&
            (tokensElement as Record<string, SwapsToken[]>)[
              currentUserAddress
            ]) ||
          [];
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
  tokenListSelector,
  (chainId, tokens, tokenList): SwapsToken[] => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId as ChainId, tokens, tokenList);
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
  tokenListSelector,
  contractBalancesSelector,
  (chainId, tokens, tokenList, balances): SwapsToken[] => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(
      balances as Record<string, unknown>,
    )
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(balanceB as number, balanceA as number) ? -1 : 1,
      )
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: SwapsToken[] = [];
    const originalTokens: SwapsToken[] = [];

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
    return addMetadata(chainId as ChainId, result, tokenList);
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
  (chainId, tokens, tokenList, topAssetsList): SwapsToken[] => {
    if (!topAssetsList || !tokens) {
      return [];
    }
    const result = topAssetsList
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((t): t is SwapsToken => Boolean(t));
    return addMetadata(chainId as ChainId, result, tokenList);
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
  action: AnyAction = { type: '' },
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as SwapsChainState | undefined;

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
