import { isObject, hasProperty } from '@metamask/utils';

type TokenAddressInput = string | { address?: string };

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController)) {
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (hasProperty(tokensController, 'allIgnoredTokens') &&
  isObject(tokensController.allIgnoredTokens)
    ? tokensController.allIgnoredTokens
    : {}) as Record<string, Record<string, TokenAddressInput[]>>;
  const ignoredTokens = (hasProperty(tokensController, 'ignoredTokens') &&
  Array.isArray(tokensController.ignoredTokens)
    ? tokensController.ignoredTokens
    : []) as TokenAddressInput[];

  const reduceTokens = (tokens: TokenAddressInput[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (isObject(token) && typeof token.address === 'string'
          ? token.address
          : '') ||
        '';
      if (tokenAddress) final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]) => {
          const newTokens = reduceTokens(tokens);
          if (newAllIgnoredTokens[chainId] === undefined) {
            newAllIgnoredTokens[chainId] = { [accountAddress]: newTokens };
          } else {
            newAllIgnoredTokens[chainId] = {
              ...newAllIgnoredTokens[chainId],
              [accountAddress]: newTokens,
            };
          }
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
