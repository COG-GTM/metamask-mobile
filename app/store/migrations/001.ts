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

  const tokensControllerState = state.engine.backgroundState.TokensController;

  if (
    !isObject(tokensControllerState) ||
    !Array.isArray(tokensControllerState.tokens)
  ) {
    return state;
  }

  for (const token of tokensControllerState.tokens) {
    if (
      isObject(token) &&
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
  }

  return state;
}
