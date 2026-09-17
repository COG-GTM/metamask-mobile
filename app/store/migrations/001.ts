import { isObject } from '@metamask/utils';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';
import { ensureValidState } from './util';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 1)) {
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController) || !Array.isArray(tokensController.tokens)) {
    return state;
  }

  const migratedTokens: unknown[] = [];
  tokensController.tokens.forEach((token) => {
    if (
      isObject(token) &&
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address as string, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  tokensController.tokens = migratedTokens;

  return state;
}
