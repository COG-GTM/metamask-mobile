type IgnoredToken = string | { address?: string };
type IgnoredTokensByAccount = Record<string, Record<string, string[]>>;

interface TokensControllerState {
  allIgnoredTokens?: Record<string, Record<string, IgnoredToken[]>>;
  ignoredTokens?: IgnoredToken[];
}

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: TokensControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    migrationState.engine.backgroundState.TokensController.allIgnoredTokens ||
    {};
  const ignoredTokens =
    migrationState.engine.backgroundState.TokensController.ignoredTokens || [];

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

  const newAllIgnoredTokens: IgnoredTokensByAccount = {};
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

  migrationState.engine.backgroundState.TokensController = {
    ...migrationState.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
