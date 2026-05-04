export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { TokensController: Record<string, unknown> } };
  };
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    (s.engine.backgroundState.TokensController.allIgnoredTokens || {}) as Record<string, Record<string, unknown[]>>;
  const ignoredTokens =
    (s.engine.backgroundState.TokensController.ignoredTokens || []) as unknown[];

  const reduceTokens = (tokens: unknown[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) || (token as Record<string, string>)?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]) => {
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]) => {
          const newTokens = reduceTokens(tokens as unknown[]);
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

  return state;
}
