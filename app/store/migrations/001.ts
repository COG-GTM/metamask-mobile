import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/

interface Token {
  symbol: string;
  address: string;
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.TokensController.tokens is an
  // array of token objects with `symbol` and `address` fields.
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const tokens = backgroundState.TokensController.tokens as Token[];
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
  backgroundState.TokensController.tokens = migratedTokens;

  return state as Record<string, unknown>;
}
