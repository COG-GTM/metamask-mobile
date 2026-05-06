import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  symbol?: string;
  address?: string;
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
    !isObject(state.engine.backgroundState.TokensController)
  ) {
    captureException(
      new Error(
        `Migration 1: Invalid state structure for TokensController migration`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController as {
    tokens: Token[];
  };
  const tokens = tokensController.tokens;
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
