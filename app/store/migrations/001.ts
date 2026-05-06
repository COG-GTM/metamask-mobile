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
export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: { backgroundState: { TokensController: { tokens: Token[] } } };
  };
  const tokens = typedState.engine.backgroundState.TokensController.tokens;
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
  typedState.engine.backgroundState.TokensController.tokens = migratedTokens;

  return state;
}
