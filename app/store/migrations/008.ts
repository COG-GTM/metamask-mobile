interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens: Record<string, Record<string, TokenEntry[]>>;
        ignoredTokens: TokenEntry[];
        [key: string]: unknown;
      };
    };
  };
}

type TokenEntry = string | { address?: string; [key: string]: unknown };

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const allIgnoredTokens =
    s.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    s.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: TokenEntry[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (typeof token === 'object' && token?.address) ||
        '';
      if (tokenAddress) final.push(tokenAddress);
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

  s.engine.backgroundState.TokensController = {
    ...s.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
