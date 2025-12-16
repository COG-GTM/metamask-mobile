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

interface Token {
  address: string;
  symbol?: string;
  decimals: number;
  name?: string;
  occurrences?: number;
  hasBalanceError?: boolean;
  image?: string;
  [key: string]: unknown;
}

interface TokenMetadata {
  name: string;
  [key: string]: unknown;
}

interface TokenList {
  [address: string]: TokenMetadata;
}

interface FeatureFlags {
  smart_transactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  smartTransactions?: {
    mobileActive?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ChainState {
  isLive: boolean;
  featureFlags?: FeatureFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: FeatureFlags;
  [chainId: string]: boolean | FeatureFlags | ChainState | undefined;
}

interface TopAsset {
  address: string;
}

interface SwapsControllerState {
  tokens: Token[];
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

export const getFeatureFlagChainId = (chainId: string): string =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? NETWORKS_CHAIN_ID.MAINNET
    : chainId;

export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

interface SetSwapsLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: string;
    featureFlags: FeatureFlags | null;
  };
}

interface SetSwapsHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

type SwapsAction = SetSwapsLivenessAction | SetSwapsHasOnboardedAction;

export const setSwapsLiveness = (
  chainId: string,
  featureFlags: FeatureFlags | null,
): SetSwapsLivenessAction => ({
  type: SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});

export const setSwapsHasOnboarded = (
  hasOnboarded: boolean,
): SetSwapsHasOnboardedAction => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

function addMetadata(
  chainId: string,
  tokens: Token[],
  tokenList: TokenList,
): Token[] {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata = tokenList[safeToChecksumAddress(token.address) || ''];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

const chainIdSelector = selectEvmChainId;
const swapsStateSelector = (state: RootState): SwapsState => state.swaps;

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainState)?.isLive || false,
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: string) => chainId],
  (swapsState, chainId) =>
    (swapsState[chainId] as ChainState)?.isLive || false,
);

export const swapsSmartTxFlagEnabled = createSelector(
  swapsStateSelector,
  (swapsState) => {
    const globalFlags = swapsState.featureFlags;
    const isEnabled = Boolean(globalFlags?.smartTransactions?.mobileActive);
    return isEnabled;
  },
);

export const selectSwapsChainFeatureFlags = createSelector(
  swapsStateSelector,
  (_state: RootState, transactionChainId?: string) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId) => ({
    ...(swapsState[chainId] as ChainState)?.featureFlags,
    smartTransactions: {
      ...((swapsState[chainId] as ChainState)?.featureFlags?.smartTransactions || {}),
      ...(swapsState.featureFlags?.smartTransactions || {}),
    },
  }),
);

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.hasOnboarded,
);

const selectSwapsControllerState = (state: RootState): SwapsControllerState =>
  state.engine.backgroundState.SwapsController as SwapsControllerState;

export const swapsControllerTokens = (state: RootState): Token[] =>
  (state.engine.backgroundState.SwapsController as SwapsControllerState)?.tokens || [];

export const selectSwapsApprovalTransaction = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.approvalTransaction,
);

export const selectSwapsQuoteValues = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.quoteValues,
);

export const selectSwapsQuotes = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.quotes,
);

export const selectSwapsAggregatorMetadata = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.aggregatorMetadata,
);

export const selectSwapsError = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.error,
);

export const selectSwapsQuoteRefreshSeconds = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.quoteRefreshSeconds,
);

export const selectSwapsUsedGasEstimate = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.usedGasEstimate,
);

export const selectSwapsUsedCustomGas = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.usedCustomGas,
);

export const selectSwapsTopAggId = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.topAggId,
);

export const selectSwapsPollingCyclesLeft = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.pollingCyclesLeft,
);

export const selectSwapsQuotesLastFetched = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.quotesLastFetched,
);

export const selectSwapsIsInPolling = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.isInPolling,
);

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens, tokens) => {
    const values = [...(swapsTokens || []), ...((tokens as Token[]) || [])]
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
  (swapsTokens, allTokens, currentUserAddress) => {
    const allTokensArr = Object.values(allTokens || {});
    const allUserTokensCrossChains = allTokensArr.reduce<Token[]>(
      (acc, tokensElement) => {
        const found =
          (tokensElement as Record<string, Token[]>)[currentUserAddress || ''] || [];
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
  (chainId, tokens, tokenList) => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens, tokenList as TokenList);
  },
);

export const topAssets = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.topAssets,
);

export const selectChainCache = createSelector(
  selectSwapsControllerState,
  (swapsControllerState) => swapsControllerState?.chainCache,
);

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
    const tokensAddressesWithBalance = Object.entries(balances || {})
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) =>
        lte(balanceB as string, balanceA as string) ? -1 : 1,
      )
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

export const swapsTopAssetsSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  topAssets,
  (chainId, tokens, tokenList, topAssetsData) => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = topAssetsData
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean) as Token[];
    return addMetadata(chainId, result, tokenList as TokenList);
  },
);

export const initialState: SwapsState = {
  isLive: true,
  hasOnboarded: true,
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

      const chainFeatureFlags = getChainFeatureFlags(featureFlags, chainId);
      const liveness = getSwapsLiveness(featureFlags, chainId);

      const chain: ChainState = {
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
