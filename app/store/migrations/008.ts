import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: MigrationState[]) =>
    tokens.reduce((final: string[], token: MigrationState) => {
      const tokenAddress =
        (typeof token === 'string' && token) || token?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress as Record<string, MigrationState[]>).forEach(
        ([accountAddress, tokens]) => {
          const newTokens = reduceTokens(tokens as MigrationState[]);
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
