type TokensByChainId = Record<string, Record<string, unknown>>;

interface Migration007State {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens?: TokensByChainId;
        allIgnoredTokens?: TokensByChainId;
        ignoredTokens?: unknown;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration007State;
  const allTokens = state.engine.backgroundState.TokensController
    .allTokens as TokensByChainId;
  const newAllTokens: TokensByChainId = {};
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
  const newAllIgnoredTokens: TokensByChainId = {};
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
