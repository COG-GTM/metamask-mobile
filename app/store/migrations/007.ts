// Legacy persisted state shape expected by this migration
interface StateWithTokensController {
  engine: {
    backgroundState: {
      TokensController: {
        allTokens?: Record<string, Record<string, unknown>>;
        ignoredTokens?: unknown;
        allIgnoredTokens?: Record<string, Record<string, unknown>>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithTokensController;
  const allTokens =
    typedState.engine.backgroundState.TokensController.allTokens;
  const newAllTokens: Record<string, Record<string, unknown>> = {};
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
  const newAllIgnoredTokens: Record<string, Record<string, unknown>> = {};
  Object.keys(
    allTokens as Record<string, Record<string, unknown>>,
  ).forEach((accountAddress) => {
    Object.keys(
      (allTokens as Record<string, Record<string, unknown>>)[accountAddress],
    ).forEach((chainId) => {
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
  };

  return typedState;
}
