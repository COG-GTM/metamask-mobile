import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 8)) {
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController)) {
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = isObject(tokensController.allIgnoredTokens)
    ? tokensController.allIgnoredTokens
    : {};
  const ignoredTokens = Array.isArray(tokensController.ignoredTokens)
    ? tokensController.ignoredTokens
    : [];

  const reduceTokens = (tokens: unknown): string[] => {
    if (!Array.isArray(tokens)) {
      return [];
    }
    return tokens.reduce((final: string[], token) => {
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

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      if (!isObject(tokensByAccountAddress)) {
        return;
      }
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]) => {
          const newTokens = reduceTokens(tokens);
          newAllIgnoredTokens[chainId] = {
            ...newAllIgnoredTokens[chainId],
            [accountAddress]: newTokens,
          };
        },
      );
    },
  );

  state.engine.backgroundState.TokensController = {
    ...tokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
