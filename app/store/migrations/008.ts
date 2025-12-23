import { isObject } from '@metamask/utils';

interface Token {
  address?: string;
}

interface TokensMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  if (!isObject(tokensControllerState)) {
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (tokensControllerState.allIgnoredTokens as TokensMap) || {};
  const ignoredTokens = (tokensControllerState.ignoredTokens as (string | Token)[]) || [];

  const reduceTokens = (tokens: (string | Token)[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) || (token as Token)?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: TokensMap = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress as Record<string, (string | Token)[]>).forEach(
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

  tokensControllerState.allIgnoredTokens = newAllIgnoredTokens;
  tokensControllerState.ignoredTokens = newIgnoredTokens;

  return state;
}
