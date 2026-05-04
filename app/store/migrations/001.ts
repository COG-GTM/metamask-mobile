import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { TokensController: { tokens: { symbol: string; address: string }[] } } };
  };
  const tokens = s.engine.backgroundState.TokensController.tokens;
  const migratedTokens: { symbol: string; address: string }[] = [];
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
