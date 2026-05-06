type IgnoredToken = string | { address?: string; [key: string]: unknown };
type AllIgnoredTokens = Record<string, Record<string, IgnoredToken[]>>;

interface State008 {
  engine: {
    backgroundState: {
      TokensController: {
        allIgnoredTokens?: AllIgnoredTokens;
        ignoredTokens?: IgnoredToken[];
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State008;
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    typedState.engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    typedState.engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: IgnoredToken[]): string[] =>
    tokens.reduce<string[]>((final, token) => {
      const tokenAddress =
        (typeof token === 'string' && token) ||
        (typeof token === 'object' && token?.address) ||
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
  } as unknown as State008['engine']['backgroundState']['TokensController'];

  return state;
}
