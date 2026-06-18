import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const bgState = state.engine.backgroundState;
  const tokensController = bgState.TokensController as Record<string, unknown> | undefined;
  if (!isObject(tokensController)) return state;

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    (tokensController.allIgnoredTokens as Record<string, Record<string, unknown[]>>) || {};
  const ignoredTokens =
    (tokensController.ignoredTokens as (string | { address?: string })[]) || [];

  const reduceTokens = (tokens: (string | { address?: string })[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (isObject(token) ? (token as { address?: string }).address : '') ||
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
          const newTokens = reduceTokens(tokens as (string | { address?: string })[]);
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

  bgState.TokensController = {
    ...tokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
