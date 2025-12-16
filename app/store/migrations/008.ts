import { isObject } from '@metamask/utils';

interface TokenWithAddress {
  address: string;
  [key: string]: unknown;
}

type TokenInput = string | TokenWithAddress;
type AllIgnoredTokens = Record<string, Record<string, unknown[]>>;

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const tokensController = engineState.backgroundState.TokensController as Record<string, unknown> | undefined;
  if (!tokensController) {
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (tokensController.allIgnoredTokens || {}) as AllIgnoredTokens;
  const ignoredTokens = (tokensController.ignoredTokens || []) as TokenInput[];

  const reduceTokens = (tokens: TokenInput[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) || (token as TokenWithAddress)?.address || '';
      if (tokenAddress) {
        final.push(tokenAddress);
      }
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: AllIgnoredTokens = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress as Record<string, TokenInput[]>).forEach(
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

  engineState.backgroundState.TokensController = {
    ...tokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
