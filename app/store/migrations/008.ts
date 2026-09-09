interface TokenWithAddress {
  address?: string;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens: Record<
          string,
          Record<string, (string | TokenWithAddress)[]>
        >;
        ignoredTokens: (string | TokenWithAddress)[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    typedState.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    typedState.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: (string | TokenWithAddress)[]) =>
    tokens.reduce((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (typeof token === 'object' && token?.address) ||
        '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, [] as string[]);

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
