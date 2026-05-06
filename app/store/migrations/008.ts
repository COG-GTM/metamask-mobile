import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface TokenLike {
  address?: string;
  [key: string]: unknown;
}

type TokenInput = string | TokenLike;

type IgnoredTokenMap = Record<string, Record<string, TokenInput[]>>;

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController)
  ) {
    captureException(
      new Error(
        `Migration 8: Invalid state structure for TokensController migration`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController as {
    allIgnoredTokens?: IgnoredTokenMap;
    ignoredTokens?: TokenInput[];
    [key: string]: unknown;
  };

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = tokensController.allIgnoredTokens || {};
  const ignoredTokens = tokensController.ignoredTokens || [];

  const reduceTokens = (tokens: TokenInput[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (typeof token === 'object' && token?.address) ||
        '';
      tokenAddress && final.push(tokenAddress);
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
