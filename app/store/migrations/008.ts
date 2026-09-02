import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

type IgnoredToken = string | { address?: string } | null | undefined;

const reduceTokens = (tokens: IgnoredToken[]): string[] =>
  tokens.reduce<string[]>((final, token) => {
    const tokenAddress =
      (typeof token === 'string' && token) ||
      (isObject(token) && typeof token.address === 'string'
        ? token.address
        : '');
    tokenAddress && final.push(tokenAddress);
    return final;
  }, []);

export default function migrate(state: unknown) {
  // This migration ensures that ignored tokens are in the correct form
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController)
  ) {
    captureException(
      new Error(
        `Migration 8: Invalid TokensController state: '${typeof state}'`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  const allIgnoredTokens = (tokensController.allIgnoredTokens || {}) as Record<
    string,
    Record<string, IgnoredToken[]>
  >;
  const ignoredTokens = (tokensController.ignoredTokens ||
    []) as IgnoredToken[];

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
