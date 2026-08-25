import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface LegacyToken {
  symbol: string;
  address: string;
}

interface Migration001State {
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
export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration001State;
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
