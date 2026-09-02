import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  address: string;
  symbol: string;
  [key: string]: unknown;
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController) ||
    !Array.isArray(state.engine.backgroundState.TokensController.tokens)
  ) {
    captureException(
      new Error(
        `Migration 1: Invalid TokensController tokens state: '${typeof state}'`,
      ),
    );
    return state;
  }

  const tokens = state.engine.backgroundState.TokensController
    .tokens as Token[];
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
  state.engine.backgroundState.TokensController.tokens = migratedTokens;

  return state;
}
