import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Reduce a list of tokens, which may be either addresses or token objects,
 * down to a list of addresses.
 */
function reduceTokens(tokens: unknown): string[] {
  if (!Array.isArray(tokens)) {
    return [];
  }
  return tokens.reduce((final: string[], token: unknown) => {
    const tokenAddress =
      (typeof token === 'string' && token) ||
      (isObject(token) && typeof token.address === 'string' && token.address) ||
      '';
    if (tokenAddress) {
      final.push(tokenAddress);
    }
    return final;
  }, []);
}

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 8)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;

  if (!isObject(tokensControllerState)) {
    return state;
  }

  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens = isObject(tokensControllerState.allIgnoredTokens)
    ? tokensControllerState.allIgnoredTokens
    : {};
  const newIgnoredTokens = reduceTokens(tokensControllerState.ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  for (const [chainId, tokensByAccountAddress] of Object.entries(
    allIgnoredTokens,
  )) {
    if (!isObject(tokensByAccountAddress)) {
      continue;
    }
    for (const [accountAddress, tokens] of Object.entries(
      tokensByAccountAddress,
    )) {
      newAllIgnoredTokens[chainId] = {
        ...newAllIgnoredTokens[chainId],
        [accountAddress]: reduceTokens(tokens),
      };
    }
  }

  state.engine.backgroundState.TokensController = {
    ...tokensControllerState,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
