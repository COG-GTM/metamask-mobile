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
import { Action } from 'redux';
import { RootState } from '..';
import { Hex } from '@metamask/utils';
import { FeatureFlags as SwapsFeatureFlags } from '@metamask/swaps-controller/dist/types';

export interface Token {
  address: string;
  symbol?: string;
  decimals: number;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

export interface TokenList {
  [address: string]: {
    name: string;
    [key: string]: unknown;
  };
}

export interface TopAsset {
  address: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalFeatureFlags = Record<string, any>;

export interface ChainState {
  isLive: boolean;
  featureFlags?: LocalFeatureFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: LocalFeatureFlags;
  [chainId: string]: boolean | LocalFeatureFlags | ChainState | undefined;
}

// If we are in dev and on a testnet, just use mainnet feature flags,
// since we don't have feature flags for testnets in the API
export const getFeatureFlagChainId = (chainId: Hex): Hex =>
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureFlags: any,
) => ({
  type: SWAPS_SET_LIVENESS as typeof SWAPS_SET_LIVENESS,
  payload: { chainId: chainId as Hex, featureFlags },
});

export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED as typeof SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Functions

function addMetadata(
  chainId: Hex,
  tokens: Token[],
  tokenList: TokenList,
): Token[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address) as string];
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
  (swapsState: SwapsState, chainId: Hex): boolean =>
    (swapsState[chainId] as ChainState)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: Hex) => chainId],
  (swapsState: SwapsState, chainId: Hex): boolean =>
    (swapsState[chainId] as ChainState)?.isLive || false,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (swapsState: SwapsState, chainId: Hex): any => ({
    ...(swapsState[chainId] as ChainState)?.featureFlags,
    smartTransactions: {
      ...((swapsState[chainId] as ChainState)?.featureFlags?.smartTransactions || {}),
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

interface SwapsControllerState {
  tokens: Token[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approvalTransaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quoteValues: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quotes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregatorMetadata: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  quoteRefreshSeconds: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usedGasEstimate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usedCustomGas: any;
  topAggId: string;
  pollingCyclesLeft: number;
  quotesLastFetched: number;
  isInPolling: boolean;
  topAssets: TopAsset[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainCache: any;
}

const selectSwapsControllerState = (state: RootState): SwapsControllerState =>
  state.engine.backgroundState.SwapsController as SwapsControllerState;

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (state: RootState): Token[] =>
  (state.engine.backgroundState.SwapsController as SwapsControllerState).tokens;

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
  (swapsTokens: Token[], tokens: Token[]): Token[] => {
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
      }, new Map<string, Token>())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (
    swapsTokens: Token[],
    allTokens: Record<string, Record<string, Token[]>>,
    currentUserAddress: string | undefined,
  ): Token[] => {
    const allTokensArr = Object.values(allTokens);
    const allUserTokensCrossChains = allTokensArr.reduce<Token[]>(
      (acc, tokensElement) => {
        const found =
          (currentUserAddress && tokensElement[currentUserAddress]) || [];
        return [...acc, ...found.flat()];
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
      }, new Map<string, Token>())
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  (chainId: Hex, tokens: Token[], tokenList: TokenList): Token[] => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState: SwapsControllerState): TopAsset[] =>
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
  (tokens: Token[]): Record<string, undefined> => {
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
  (tokens: Token[]): Record<string, undefined> => {
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
    const balancesRecord = balances as Record<string, string>;
    const tokensAddressesWithBalance = Object.entries(balancesRecord)
      .filter(([, balance]) => balance && balance !== '0x0')
      .sort(([, balanceA], [, balanceB]) => (lte(Number(balanceB), Number(balanceA)) ? -1 : 1))
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance: Token[] = [];
    const originalTokens: Token[] = [];

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
    tokens: Token[],
    tokenList: TokenList,
    topAssetsData: TopAsset[],
  ): Token[] => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = topAssetsData
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter((token): token is Token => Boolean(token));
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

interface SetSwapsLivenessAction extends Action<typeof SWAPS_SET_LIVENESS> {
  payload: {
    chainId: Hex;
    featureFlags: LocalFeatureFlags | null;
  };
}

interface SetSwapsHasOnboardedAction
  extends Action<typeof SWAPS_SET_HAS_ONBOARDED> {
  payload: boolean;
}

export type SwapsAction = SetSwapsLivenessAction | SetSwapsHasOnboardedAction;

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

      const chainFeatureFlags = getChainFeatureFlags(featureFlags as SwapsFeatureFlags, chainId);
      const liveness = getSwapsLiveness(featureFlags as SwapsFeatureFlags, chainId);

      const chain: ChainState = {
        ...data,
        featureFlags: chainFeatureFlags as LocalFeatureFlags,
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
