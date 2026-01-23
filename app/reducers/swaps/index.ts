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
import type { RootState } from '../index';
import type { Hex } from '@metamask/utils';
import type { FeatureFlags } from '@metamask/swaps-controller/dist/types';

export interface SwapsToken {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  occurrences?: number;
}

export interface TopAsset {
  address: string;
}

export interface ChainSwapsState {
  isLive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureFlags?: any;
}

export interface SmartTransactionsFlags {
  mobileActive?: boolean;
  extensionActive?: boolean;
  mobileActiveIOS?: boolean;
  mobileActiveAndroid?: boolean;
}

export interface GlobalFeatureFlags {
  smart_transactions?: unknown;
  smartTransactions?: SmartTransactionsFlags;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags?: GlobalFeatureFlags;
  [chainId: string]: ChainSwapsState | boolean | undefined | GlobalFeatureFlags;
}

export const getFeatureFlagChainId = (chainId: Hex): Hex =>
  __DEV__ && allowedTestnetChainIds.includes(chainId)
    ? (NETWORKS_CHAIN_ID.MAINNET as Hex)
    : chainId;

export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
const MAX_TOKENS_WITH_BALANCE = 5;

interface SetSwapsLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: {
    chainId: Hex;
    featureFlags: FeatureFlags | null;
  };
}

interface SetSwapsHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

type SwapsAction = SetSwapsLivenessAction | SetSwapsHasOnboardedAction;

export const setSwapsLiveness = (
  chainId: Hex,
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
  chainId: Hex,
  tokens: SwapsToken[],
  tokenList: Record<string, { name?: string }>,
): SwapsToken[] {
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
const swapsStateSelector = (state: RootState) => state.swaps;

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => {
    const chainState = swapsState[chainId as string] as ChainSwapsState | undefined;
    return chainState?.isLive || false;
  },
);

export const swapsLivenessMultichainSelector = createSelector(
  [swapsStateSelector, (_state: RootState, chainId: Hex) => chainId],
  (swapsState, chainId) => {
    const chainState = swapsState[chainId] as ChainSwapsState | undefined;
    return chainState?.isLive || false;
  },
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
  (_state: RootState, transactionChainId?: Hex) =>
    transactionChainId || selectEvmChainId(_state),
  (swapsState, chainId) => {
    const chainState = swapsState[chainId as string] as ChainSwapsState | undefined;
    return {
      ...chainState?.featureFlags,
      smartTransactions: {
        ...(chainState?.featureFlags?.smartTransactions || {}),
        ...(swapsState.featureFlags?.smartTransactions || {}),
      },
    };
  },
);

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.hasOnboarded,
);

const selectSwapsControllerState = (state: RootState) =>
  state.engine.backgroundState.SwapsController;

export const swapsControllerTokens = (state: RootState) =>
  state.engine.backgroundState.SwapsController?.tokens;

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

interface TokenWithBalance {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  hasBalanceError?: boolean;
  image?: string;
}

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  selectTokens,
  (swapsTokens, tokens): SwapsToken[] => {
    const values = [
      ...((swapsTokens as TokenWithBalance[]) || []),
      ...((tokens as TokenWithBalance[]) || []),
    ]
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
      }, new Map<string, SwapsToken>())
      .values();

    return [...values];
  },
);

const swapsControllerAndUserTokensMultichain = createSelector(
  swapsControllerTokens,
  selectAllTokens,
  selectSelectedInternalAccountAddress,
  (swapsTokens, allTokens, currentUserAddress): SwapsToken[] => {
    const allTokensArr = Object.values(allTokens || {});
    const allUserTokensCrossChains = allTokensArr.reduce<TokenWithBalance[]>(
      (acc, tokensElement) => {
        const found =
          (tokensElement as Record<string, TokenWithBalance[]>)[
            currentUserAddress as string
          ] || [];
        return [...acc, ...found.flat()];
      },
      [],
    );
    const values = [
      ...((swapsTokens as TokenWithBalance[]) || []),
      ...(allUserTokensCrossChains || []),
    ]
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
      }, new Map<string, SwapsToken>())
      .values();
    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  (chainId, tokens, tokenList): SwapsToken[] => {
    if (!tokens) {
      return [];
    }

    return addMetadata(
      chainId as Hex,
      tokens,
      tokenList as Record<string, { name?: string }>,
    );
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

export const swapsTokensWithBalanceSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  selectContractBalances,
  (chainId, tokens, tokenList, balances): SwapsToken[] => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances || {})
      .filter(([, balance]) => balance !== '0x0' && balance !== '0x00')
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
    return addMetadata(
      chainId as Hex,
      result,
      tokenList as Record<string, { name?: string }>,
    );
  },
);

export const swapsTopAssetsSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  selectTokenList,
  topAssets,
  (chainId, tokens, tokenList, topAssetsData): SwapsToken[] => {
    if (!topAssetsData || !tokens) {
      return [];
    }
    const result = (topAssetsData as TopAsset[])
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean) as SwapsToken[];
    return addMetadata(
      chainId as Hex,
      result,
      tokenList as Record<string, { name?: string }>,
    );
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
        chainId as `0x${string}`,
      );
      const liveness = getSwapsLiveness(featureFlags, chainId as `0x${string}`);

      const chain: ChainSwapsState = {
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
