import { isObject } from '@metamask/utils';
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
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const tokensController = engineState.backgroundState.TokensController as Record<string, unknown> | undefined;
  if (!tokensController?.tokens) {
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
