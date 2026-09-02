type IgnoredTokensByChainId = Record<string, Record<string, string[]>>;

type LegacyIgnoredToken = string | { address?: string };

interface Migration008State {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: Record<string, Record<string, unknown>>;
        ignoredTokens?: LegacyIgnoredToken[];
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration008State;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: LegacyIgnoredToken[]) =>
    tokens.reduce((final: string[], token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (token as { address?: string } | undefined)?.address ||
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
          const newTokens = reduceTokens(tokens as LegacyIgnoredToken[]);
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

  state.engine.backgroundState.TokensController = {
    ...state.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
