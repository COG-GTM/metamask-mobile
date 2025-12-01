import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const tokens = state.engine.backgroundState.TokensController.tokens;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migratedTokens: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens.forEach((token: any) => {
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
