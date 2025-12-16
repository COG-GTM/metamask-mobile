import { isObject } from '@metamask/utils';

type TokensArray = unknown[];
type AllTokens = Record<string, Record<string, TokensArray>>;
type AllIgnoredTokens = Record<string, Record<string, unknown[]>>;

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const tokensController = engineState.backgroundState.TokensController as Record<string, unknown> | undefined;
  if (!tokensController) {
    return state;
  }

  const allTokens = tokensController.allTokens as AllTokens | undefined;
  const newAllTokens: AllTokens = {};

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

  const ignoredTokens = tokensController.ignoredTokens as unknown[] | undefined;
  const newAllIgnoredTokens: AllIgnoredTokens = {};

  if (allTokens) {
    Object.keys(allTokens).forEach((accountAddress) => {
      Object.keys(allTokens[accountAddress]).forEach((chainId) => {
        if (newAllIgnoredTokens[chainId] === undefined) {
          newAllIgnoredTokens[chainId] = {
            [accountAddress]: ignoredTokens || [],
          };
        } else {
          newAllIgnoredTokens[chainId] = {
            ...newAllIgnoredTokens[chainId],
            [accountAddress]: ignoredTokens || [],
          };
        }
      });
    });
  }

  engineState.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
