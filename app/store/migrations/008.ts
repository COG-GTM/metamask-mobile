export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    s.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    s.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: any[]) =>
    tokens.reduce((final: string[], token: any) => {
      const tokenAddress =
        (typeof token === 'string' && token) || token?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, any> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress as Record<string, any>).forEach(
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

  s.engine.backgroundState.TokensController = {
    ...s.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return s;
}
