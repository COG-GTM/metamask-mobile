import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
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
import type { RootState } from '../index';

// Chain feature flags interface for per-chain settings
interface ChainFeatureFlags {
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
    returnTxHashAsap?: boolean;
    mobileActive?: boolean;
    extensionActive?: boolean;
    mobileActiveIOS?: boolean;
    mobileActiveAndroid?: boolean;
    globalSetting?: boolean;
    chainSpecificSetting?: boolean;
    goerliSetting?: boolean;
  };
  mainnetFlag?: boolean;
  goerliFlag?: boolean;
}

// Global feature flags for smart transactions
interface GlobalFeatureFlags {
  smart_transactions?: {
    mobile_active?: boolean;
    extension_active?: boolean;
  };
  smartTransactions?: {
    mobileActive?: boolean;
    extensionActive?: boolean;
    mobileActiveIOS?: boolean;
    mobileActiveAndroid?: boolean;
    globalSetting?: boolean;
  };
}

// Per-chain state
interface ChainSwapsState {
  isLive: boolean;
  featureFlags?: ChainFeatureFlags;
}

// Main swaps reducer state
export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: GlobalFeatureFlags;
  [chainId: string]: boolean | GlobalFeatureFlags | ChainSwapsState | undefined;
}

// Token interface for swaps
interface SwapsToken {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  occurrences?: number;
  iconUrl?: string;
  hasBalanceError?: boolean;
  image?: string;
  aggregators?: string[];
}

// Token list metadata
interface TokenMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  address?: string;
}

// Token list type
type TokenList = Record<string, TokenMetadata>;

// Top asset interface
interface TopAsset {
  address: string;
}

// SwapsController state interface
interface SwapsControllerState {
  tokens?: SwapsToken[];
  approvalTransaction?: unknown;
  quoteValues?: unknown;
  quotes?: unknown;
  aggregatorMetadata?: unknown;
  error?: unknown;
  quoteRefreshSeconds?: number;
  usedGasEstimate?: unknown;
  usedCustomGas?: unknown;
  topAggId?: string;
  pollingCyclesLeft?: number;
  quotesLastFetched?: number;
  isInPolling?: boolean;
  topAssets?: TopAsset[];
  chainCache?: unknown;
}

// State with engine for selectors
interface StateWithEngine {
  engine: {
    backgroundState: {
      SwapsController: SwapsControllerState;
    };
  };
  swaps: SwapsState;
}

// Action types
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';

// Action payload interfaces
interface SetLivenessPayload {
  chainId: Hex;
  featureFlags: FeatureFlags | null;
}

interface SetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: SetLivenessPayload;
}

interface SetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

type SwapsAction = SetLivenessAction | SetHasOnboardedAction;

const MAX_TOKENS_WITH_BALANCE = 5;

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: Hex): Hex =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

// * Action Creator
export const setSwapsLiveness = (
  chainId: Hex,
  featureFlags: FeatureFlags | null,
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
  chainId: Hex,
  tokens: SwapsToken[],
  tokenList: TokenList,
): SwapsToken[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address) ?? ''];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors
const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState): SwapsState =>
  state.swaps as SwapsState;

/**
 * Returns the swaps liveness state
 */
export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState: SwapsState, chainId: Hex): boolean =>
    (swapsState[chainId] as ChainSwapsState)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: Hex) => chainId],
  (swapsState: SwapsState, chainId: Hex): boolean =>
    (swapsState[chainId] as ChainSwapsState)?.isLive || false,
);

/**
 * Returns if smart transactions are enabled in feature flags
 */
export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState: SwapsState): boolean => {
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
  (swapsState: SwapsState, chainId: Hex) => ({
    ...(swapsState[chainId] as ChainSwapsState).featureFlags,
    smartTransactions: {
      ...((swapsState[chainId] as ChainSwapsState).featureFlags
        ?.smartTransactions || {}),
      ...(swapsState.featureFlags?.smartTransactions || {}),
    },
  }),
);

/**
 * Returns the swaps onboarded state
 */
export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState: SwapsState): boolean => swapsState.hasOnboarded,
);

const selectSwapsControllerState = (
  state: StateWithEngine,
): SwapsControllerState => state.engine.backgroundState.SwapsController;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (
  state: StateWithEngine,
): SwapsToken[] | undefined =>
  state.engine.backgroundState.SwapsController.tokens;

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.approvalTransaction,
);

export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.quoteValues,
);

export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) => swapsControllerState.quotes,
);

export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.aggregatorMetadata,
);

export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) => swapsControllerState.error,
);

export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.quoteRefreshSeconds,
);

export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.usedGasEstimate,
);

export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.usedCustomGas,
);

export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.topAggId,
);

export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.pollingCyclesLeft,
);

export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.quotesLastFetched,
);

export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.isInPolling,
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
          (tokensElement[currentUserAddress as string] as SwapsToken[]) || [];
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
  (chainId: Hex, tokens: SwapsToken[], tokenList): SwapsToken[] => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList as TokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.topAssets,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState) =>
    swapsControllerState.chainCache,
);

/**
 * Returns a memoized object that only has the addesses of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
export const swapsTokensObjectSelector = createSelector(
  swapsControllerAndUserTokens,
  (tokens: SwapsToken[]): Record<string, undefined> => {
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
  (tokens: SwapsToken[]): Record<string, undefined> => {
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
  (
    chainId: Hex,
    tokens: SwapsToken[],
    tokenList,
    balances: Record<Hex, Hex>,
  ): SwapsToken[] => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => balance !== '0x0')
      .sort(([, balanceA], [, balanceB]) =>
        lte(Number(balanceB), Number(balanceA)) ? -1 : 1,
      )
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
  (
    chainId: Hex,
    tokens: SwapsToken[],
    tokenList,
    topAssetsData: TopAsset[] | undefined,
  ): SwapsToken[] => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = topAssetsData
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
  },
};

/* eslint-disable @typescript-eslint/default-param-last */
function swapsReducer(
  state: SwapsState = initialState,
  action: SwapsAction,
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as ChainSwapsState | undefined;

      const chainNoFlags: ChainSwapsState = {
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
        featureFlags,
        chainId,
      ) as ChainFeatureFlags;
      const liveness = getSwapsLiveness(featureFlags, chainId);

      const chain: ChainSwapsState = {
        ...data,
        featureFlags: chainFeatureFlags,
        isLive: liveness as boolean,
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
