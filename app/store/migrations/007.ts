import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

type ChainTokenMap = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController)
  ) {
    captureException(
      new Error(
        `Migration 7: Invalid state structure for TokensController migration`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController as {
    allTokens?: Record<string, Record<string, unknown>>;
    ignoredTokens?: unknown;
  };
  const allTokens = tokensController.allTokens;
  const newAllTokens: ChainTokenMap = {};
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

  const ignoredTokens = tokensController.ignoredTokens;
  const newAllIgnoredTokens: ChainTokenMap = {};
  Object.keys(allTokens ?? {}).forEach((accountAddress) => {
    Object.keys(allTokens?.[accountAddress] ?? {}).forEach((chainId) => {
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
