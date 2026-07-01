type IgnoredToken = string | { address?: string };
type AllIgnoredTokens = Record<string, Record<string, IgnoredToken[]>>;

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: Record<string, unknown>;
      };
    };
  };
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = (typedState.engine.backgroundState.TokensController
    .allIgnoredTokens || {}) as AllIgnoredTokens;
  const ignoredTokens = (typedState.engine.backgroundState.TokensController
    .ignoredTokens || []) as IgnoredToken[];

  const reduceTokens = (tokens: IgnoredToken[]) =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (token as { address?: string })?.address ||
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

  typedState.engine.backgroundState.TokensController = {
    ...typedState.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return typedState;
}
