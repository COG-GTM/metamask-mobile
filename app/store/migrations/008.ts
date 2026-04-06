import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Ensure ignored tokens are stored as address strings
 * rather than full token objects.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 8: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 8: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 8: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.TokensController)) {
    captureException(
      new Error(`Migration 8: Invalid TokensController state`),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState
    .TokensController as Record<string, unknown>;

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
