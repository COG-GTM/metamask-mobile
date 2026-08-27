/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: any[]): any[] =>
    tokens.reduce((final: any[], token: any) => {
      const tokenAddress =
        (typeof token === 'string' && token) || token?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, any>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]: [string, any]) => {
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]: [string, any]) => {
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
