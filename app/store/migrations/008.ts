export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: {
          allIgnoredTokens?: Record<
            string,
            Record<string, unknown[]>
          >;
          ignoredTokens?: unknown[];
          [key: string]: unknown;
        };
      };
    };
  };
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    typedState.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    typedState.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: unknown[]) =>
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
    },
  );

  typedState.engine.backgroundState.TokensController = {
    ...typedState.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
