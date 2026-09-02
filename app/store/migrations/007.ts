import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

type TokensByChainId = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController) ||
    !isObject(state.engine.backgroundState.TokensController.allTokens)
  ) {
    captureException(
      new Error(
        `Migration 7: Invalid TokensController allTokens state: '${typeof state}'`,
      ),
    );
    return state;
  }

  const allTokens = state.engine.backgroundState.TokensController
    .allTokens as TokensByChainId;
  const newAllTokens: TokensByChainId = {};
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
