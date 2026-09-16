interface LegacyIgnoredTokenObject {
  address?: string;
}

type LegacyIgnoredToken = string | LegacyIgnoredTokenObject | null | undefined;

type LegacyIgnoredTokensByChain = Record<
  string,
  Record<string, LegacyIgnoredToken[]>
>;

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: LegacyIgnoredTokensByChain;
        ignoredTokens?: LegacyIgnoredToken[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    state.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    state.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: LegacyIgnoredToken[]) =>
    tokens.reduce((final: string[], token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (token as LegacyIgnoredTokenObject)?.address ||
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
