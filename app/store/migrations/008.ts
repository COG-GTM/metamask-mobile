type IgnoredToken = string | { address?: string };

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: Record<string, Record<string, IgnoredToken[]>>;
        ignoredTokens?: IgnoredToken[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    migratedState.engine.backgroundState.TokensController.allIgnoredTokens ||
    {};
  const ignoredTokens =
    migratedState.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: IgnoredToken[]) =>
    tokens.reduce((final: string[], token) => {
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

  migratedState.engine.backgroundState.TokensController = {
    ...migratedState.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return migratedState;
}
