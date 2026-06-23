type IgnoredToken = string | { address?: string } | null | undefined;

export default function migrate(state: unknown): Record<string, unknown> {
  // This migration ensures that ignored tokens are in the correct form
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const tokensController = backgroundState.TokensController as Record<
    string,
    unknown
  >;
  const allIgnoredTokens =
    (tokensController.allIgnoredTokens as Record<
      string,
      Record<string, IgnoredToken[]>
    >) || {};
  const ignoredTokens =
    (tokensController.ignoredTokens as IgnoredToken[]) || [];

  const reduceTokens = (tokens: IgnoredToken[]): string[] =>
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

  backgroundState.TokensController = {
    ...tokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state as Record<string, unknown>;
}
