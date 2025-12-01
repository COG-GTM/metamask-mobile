// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reduceTokens = (tokens: any[]) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokens.reduce((final: string[], token: any) => {
      const tokenAddress =
        (typeof token === 'string' && token) || token?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllIgnoredTokens: Record<string, any> = {};
  Object.entries(allIgnoredTokens).forEach(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ([chainId, tokensByAccountAddress]: [string, any]) => {
      Object.entries(tokensByAccountAddress).forEach(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
