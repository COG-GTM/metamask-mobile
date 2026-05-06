import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface TokenLike {
  address: string;
  symbol: string;
  [key: string]: unknown;
}

/**
 * MakerDAO DAI => SAI
 *
 **/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const tokens: TokenLike[] =
    state.engine.backgroundState.TokensController.tokens;
  const migratedTokens: TokenLike[] = [];
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
