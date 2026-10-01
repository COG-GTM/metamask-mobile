import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 007: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.TokensController)) {
    return state as Record<string, unknown>;
  }

  const tokensController = backgroundState.TokensController as Record<string, unknown>;
  const allTokens = tokensController.allTokens as Record<string, Record<string, unknown>> | undefined;
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

  const ignoredTokens = tokensController.ignoredTokens;
  const newAllIgnoredTokens: Record<string, Record<string, unknown>> = {};
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

  backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state as Record<string, unknown>;
}
