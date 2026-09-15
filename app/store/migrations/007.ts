type TokensByAccountByChain = Record<string, Record<string, unknown>>;

interface LegacyState {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: TokensByAccountByChain;
        ignoredTokens?: unknown;
        allIgnoredTokens?: TokensByAccountByChain;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const allTokens = state.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: TokensByAccountByChain = {};
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
    state.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: TokensByAccountByChain = {};
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

  state.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
