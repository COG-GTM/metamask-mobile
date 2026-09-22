import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 7)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;

  if (
    !isObject(tokensControllerState) ||
    !isObject(tokensControllerState.allTokens)
  ) {
    return state;
  }

  const { allTokens, ignoredTokens } = tokensControllerState;
  const newAllTokens: Record<string, Record<string, unknown>> = {};
  const newAllIgnoredTokens: Record<string, Record<string, unknown>> = {};

  for (const [accountAddress, tokensByChainId] of Object.entries(allTokens)) {
    if (!isObject(tokensByChainId)) {
      continue;
    }
    for (const [chainId, tokens] of Object.entries(tokensByChainId)) {
      newAllTokens[chainId] = {
        ...newAllTokens[chainId],
        [accountAddress]: tokens,
      };
      newAllIgnoredTokens[chainId] = {
        ...newAllIgnoredTokens[chainId],
        [accountAddress]: ignoredTokens,
      };
    }
  }

  state.engine.backgroundState.TokensController = {
    allTokens: newAllTokens,
    allIgnoredTokens: newAllIgnoredTokens,
  };

  return state;
}
