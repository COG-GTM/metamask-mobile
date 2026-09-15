import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

const reduceTokens = (tokens: unknown): string[] => {
  if (!Array.isArray(tokens)) {
    return [];
  }
  return tokens.reduce<string[]>((final, token: unknown) => {
    const tokenAddress =
      (typeof token === 'string' && token) ||
      (isObject(token) && typeof token.address === 'string' && token.address) ||
      '';
    if (tokenAddress) {
      final.push(tokenAddress);
    }
    return final;
  }, []);
};

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 8)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  if (!isObject(tokensControllerState)) {
    captureException(
      new Error(
        `Migration 8: Invalid TokensController state: '${typeof tokensControllerState}'`,
      ),
    );
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = isObject(tokensControllerState.allIgnoredTokens)
    ? tokensControllerState.allIgnoredTokens
    : {};
  const ignoredTokens = Array.isArray(tokensControllerState.ignoredTokens)
    ? tokensControllerState.ignoredTokens
    : [];

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      if (!isObject(tokensByAccountAddress)) {
        return;
      }
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]) => {
          newAllIgnoredTokens[chainId] = {
            ...(newAllIgnoredTokens[chainId] ?? {}),
            [accountAddress]: reduceTokens(tokens),
          };
        },
      );
    },
  );

  state.engine.backgroundState.TokensController = {
    ...tokensControllerState,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
