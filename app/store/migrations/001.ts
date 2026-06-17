import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  symbol?: string;
  address?: string;
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
  [key: string]: unknown;
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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

  return typedState as unknown as Record<string, unknown>;
}
