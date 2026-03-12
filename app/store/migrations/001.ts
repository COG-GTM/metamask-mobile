import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const tokens = s.engine.backgroundState.TokensController.tokens;
  const migratedTokens: any[] = [];
  tokens.forEach((token: any) => {
    if (
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  s.engine.backgroundState.TokensController.tokens = migratedTokens;

  return s;
}
