import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
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
    !hasProperty(tokensControllerState, 'tokens') ||
    !Array.isArray(tokensControllerState.tokens)
  ) {
    captureException(
      new Error(
        `Migration 1: Invalid TokensController state: '${typeof tokensControllerState}'`,
      ),
    );
    return state;
  }

  const tokens: unknown[] = tokensControllerState.tokens;
  const migratedTokens: unknown[] = [];
  tokens.forEach((token) => {
    if (
      isObject(token) &&
      token.symbol === 'DAI' &&
      typeof token.address === 'string' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  tokensControllerState.tokens = migratedTokens;

  return state;
}
