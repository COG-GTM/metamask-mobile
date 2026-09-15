import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

type TokensByChainAndAccount = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 7)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  if (
    !isObject(tokensControllerState) ||
    !isObject(tokensControllerState.allTokens)
  ) {
    captureException(
      new Error(
        `Migration 7: Invalid TokensController state: '${typeof tokensControllerState}'`,
      ),
    );
    return state;
  }

  const { allTokens, ignoredTokens } = tokensControllerState;
  const newAllTokens: TokensByChainAndAccount = {};
  const newAllIgnoredTokens: TokensByChainAndAccount = {};

  Object.keys(allTokens).forEach((accountAddress) => {
    const tokensByChainId = allTokens[accountAddress];
    if (!isObject(tokensByChainId)) {
      return;
    }
    Object.keys(tokensByChainId).forEach((chainId) => {
      newAllTokens[chainId] = {
        ...(newAllTokens[chainId] ?? {}),
        [accountAddress]: tokensByChainId[chainId],
      };
      newAllIgnoredTokens[chainId] = {
        ...(newAllIgnoredTokens[chainId] ?? {}),
        [accountAddress]: ignoredTokens,
      };
    });
  });

  state.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
