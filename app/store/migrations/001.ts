import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  symbol: string;
  address: string;
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

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const tokens = s.engine.backgroundState.TokensController.tokens;
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
  s.engine.backgroundState.TokensController.tokens = migratedTokens;

  return state;
}
