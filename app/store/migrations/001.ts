import { isObject, hasProperty } from '@metamask/utils';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  symbol: string;
  address: string;
  [key: string]: unknown;
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const tokensController = state.engine.backgroundState.TokensController;
  if (
    !isObject(tokensController) ||
    !hasProperty(tokensController, 'tokens') ||
    !Array.isArray(tokensController.tokens)
  ) {
    return state;
  }
  const tokens = tokensController.tokens as Token[];
  const migratedTokens: Token[] = [];
  tokens.forEach((token) => {
    if (
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  tokensController.tokens = migratedTokens;

  return state;
}
