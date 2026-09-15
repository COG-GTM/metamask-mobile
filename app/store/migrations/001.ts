import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface LegacyToken {
  symbol: string;
  address: string;
  [key: string]: unknown;
}

interface LegacyState {
  engine: {
    backgroundState: {
      TokensController: {
        tokens: LegacyToken[];
      };
    };
  };
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const tokens = state.engine.backgroundState.TokensController.tokens;
  const migratedTokens: LegacyToken[] = [];
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
