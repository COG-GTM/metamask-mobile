import type { MigrationState } from './migration-types';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  const tokens = state.engine.backgroundState.TokensController.tokens;
  const migratedTokens: MigrationState[] = [];
  tokens.forEach((token: MigrationState) => {
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
