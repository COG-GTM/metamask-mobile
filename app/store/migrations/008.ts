import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 8: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(`Migration 8: Invalid engine state: '${typeof state.engine}'`),
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
      new Error(
        `Migration 8: Invalid TokensController state: '${typeof state.engine
          .backgroundState.TokensController}'`,
      ),
    );
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (state.engine.backgroundState.TokensController
    .allIgnoredTokens || {}) as Record<
    string,
    Record<string, Array<string | Record<string, unknown>>>
  >;
  const ignoredTokens = (state.engine.backgroundState.TokensController
    .ignoredTokens || []) as Array<string | Record<string, unknown>>;

  const reduceTokens = (tokens: Array<string | Record<string, unknown>>) =>
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
    ...state.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
