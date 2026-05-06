import { isObject, hasProperty } from '@metamask/utils';

type AddressedByNetwork = Record<string, Record<string, unknown>>;

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController)) {
    return state;
  }

  const allTokens = (
    hasProperty(tokensController, 'allTokens') &&
    isObject(tokensController.allTokens)
      ? tokensController.allTokens
      : {}
  ) as Record<string, Record<string, unknown>>;
  const newAllTokens: AddressedByNetwork = {};
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

  const ignoredTokens = hasProperty(tokensController, 'ignoredTokens')
    ? tokensController.ignoredTokens
    : undefined;
  const newAllIgnoredTokens: AddressedByNetwork = {};
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
