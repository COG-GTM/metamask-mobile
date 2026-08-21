import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface Token {
  symbol: string;
  address: string;
}

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
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
export default function migrate(state: unknown): Record<string, unknown> {
  const tokensControllerState = (state as MigrationState).engine.backgroundState
    .TokensController;
  const tokens = tokensControllerState.tokens;
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
  tokensControllerState.tokens = migratedTokens;

  return state as Record<string, unknown>;
}
