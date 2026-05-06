type ChainTokens<T = unknown> = Record<string, Record<string, T>>;

interface State007 {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: ChainTokens;
        ignoredTokens?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State007;
  const allTokens =
    typedState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: ChainTokens = {};
  if (allTokens) {
    Object.keys(allTokens).forEach((accountAddress) => {
      Object.keys(allTokens[accountAddress]).forEach((chainId) => {
        const tokensArray = allTokens[accountAddress][chainId];
        if (newAllTokens[chainId] === undefined) {
          newAllTokens[chainId] = { [accountAddress]: tokensArray };
        } else {
          newAllTokens[chainId] = {
            ...newAllTokens[chainId],
            [accountAddress]: tokensArray,
          };
        }
      });
    });
  }

  const ignoredTokens =
    typedState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: ChainTokens = {};
  Object.keys(allTokens).forEach((accountAddress) => {
    Object.keys(allTokens[accountAddress]).forEach((chainId) => {
      if (newAllIgnoredTokens[chainId] === undefined) {
        newAllIgnoredTokens[chainId] = {
          [accountAddress]: ignoredTokens,
        };
      } else {
        newAllIgnoredTokens[chainId] = {
          ...newAllIgnoredTokens[chainId],
          [accountAddress]: ignoredTokens,
        };
      }
    });
  });

  typedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  } as unknown as State007['engine']['backgroundState']['TokensController'];

  return state;
}
