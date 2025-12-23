import { isObject, hasProperty } from '@metamask/utils';

interface TokensMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  if (!isObject(tokensControllerState)) {
    return state;
  }

  const allTokens = tokensControllerState.allTokens as TokensMap | undefined;
  const newAllTokens: TokensMap = {};
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

  const ignoredTokens = tokensControllerState.ignoredTokens;
  const newAllIgnoredTokens: TokensMap = {};
  if (allTokens) {
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
  }

  tokensControllerState.allTokens = newAllTokens;
  tokensControllerState.allIgnoredTokens = newAllIgnoredTokens;

  return state;
}
