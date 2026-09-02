type TokensByAccountAddress = Record<string, Record<string, unknown>>;

interface Migration007State {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens: TokensByAccountAddress;
        ignoredTokens?: unknown;
        allIgnoredTokens?: TokensByAccountAddress;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration007State;
  const allTokens =
    migratedState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: TokensByAccountAddress = {};
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
    migratedState.engine.backgroundState.TokensController.ignoredTokens;
  const newAllIgnoredTokens: TokensByAccountAddress = {};
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

  migratedState.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return migratedState;
}
