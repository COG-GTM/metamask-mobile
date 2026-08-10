import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  address: string;
  symbol: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        tokens: Token[];
      };
    };
  };
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const tokens = migratedState.engine.backgroundState.TokensController.tokens;
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
  migratedState.engine.backgroundState.TokensController.tokens = migratedTokens;

  return migratedState;
}
