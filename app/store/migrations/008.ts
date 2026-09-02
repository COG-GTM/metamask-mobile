type IgnoredTokensByChainId = Record<string, Record<string, string[]>>;

interface TokenWithAddress {
  address?: string;
}

interface Migration008State {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: Record<string, Record<string, unknown>>;
        ignoredTokens?: unknown[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration008State;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    migratedState.engine.backgroundState.TokensController.allIgnoredTokens ||
    {};
  const ignoredTokens =
    migratedState.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: unknown[]) =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (token as TokenWithAddress)?.address ||
        '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: IgnoredTokensByChainId = {};
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

  migratedState.engine.backgroundState.TokensController = {
    ...migratedState.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return migratedState;
}
