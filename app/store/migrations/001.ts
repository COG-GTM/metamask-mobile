import { isObject } from '@metamask/utils';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const tokensController = state.engine.backgroundState.TokensController as
    | Record<string, unknown>
    | undefined;
  if (!isObject(tokensController)) return state;

  const tokens = tokensController.tokens as
    | { symbol: string; address: string; [key: string]: unknown }[]
    | undefined;
  if (!Array.isArray(tokens)) return state;

  const migratedTokens: {
    symbol: string;
    address: string;
    [key: string]: unknown;
  }[] = [];
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
