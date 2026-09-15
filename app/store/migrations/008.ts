type LegacyIgnoredToken = string | { address?: string } | null | undefined;

interface LegacyState {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: Record<string, Record<string, LegacyIgnoredToken[]>>;
        ignoredTokens?: LegacyIgnoredToken[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: LegacyIgnoredToken[]) =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (token as { address?: string } | null | undefined)?.address ||
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

  state.engine.backgroundState.TokensController = {
    ...state.engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
