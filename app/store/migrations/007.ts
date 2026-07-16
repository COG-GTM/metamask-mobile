import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

type ByChain = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 7)) {
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController)) {
    return state;
  }

  const allTokens = tokensController.allTokens;
  const newAllTokens: ByChain = {};
  if (isObject(allTokens)) {
    Object.keys(allTokens).forEach((accountAddress) => {
      const byChain = allTokens[accountAddress];
      if (!isObject(byChain)) {
        return;
      }
      Object.keys(byChain).forEach((chainId) => {
        const tokensArray = byChain[chainId];
        newAllTokens[chainId] = {
          ...newAllTokens[chainId],
          [accountAddress]: tokensArray,
        };
      });
    });
  }

  const ignoredTokens = tokensController.ignoredTokens;
  const newAllIgnoredTokens: ByChain = {};
  if (isObject(allTokens)) {
    Object.keys(allTokens).forEach((accountAddress) => {
      const byChain = allTokens[accountAddress];
      if (!isObject(byChain)) {
        return;
      }
      Object.keys(byChain).forEach((chainId) => {
        newAllIgnoredTokens[chainId] = {
          ...newAllIgnoredTokens[chainId],
          [accountAddress]: ignoredTokens,
        };
      });
    });
  }

  state.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
