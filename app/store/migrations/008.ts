import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 008: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 008: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.TokensController)) {
    captureException(
      new Error(`Migration 008: Invalid TokensController state`),
    );
    return state;
  }

  const tokensController = backgroundState.TokensController as Record<
    string,
    unknown
  >;

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (tokensController.allIgnoredTokens || {}) as Record<
    string,
    Record<string, unknown[]>
  >;
  const ignoredTokens = (tokensController.ignoredTokens || []) as unknown[];

  const reduceTokens = (tokens: unknown[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (isObject(token) ? (token.address as string) : '') ||
        '';
      if (tokenAddress) {
        final.push(tokenAddress);
      }
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<
    string,
    Record<string, string[]>
  > = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      if (isObject(tokensByAccountAddress)) {
        Object.entries(
          tokensByAccountAddress as Record<string, unknown[]>,
        ).forEach(([accountAddress, tokens]) => {
          const newTokens = reduceTokens(tokens);
          if (newAllIgnoredTokens[chainId] === undefined) {
            newAllIgnoredTokens[chainId] = { [accountAddress]: newTokens };
          } else {
            newAllIgnoredTokens[chainId] = {
              ...newAllIgnoredTokens[chainId],
              [accountAddress]: newTokens,
            };
          }
        });
      }
    },
  );

  backgroundState.TokensController = {
    ...tokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
