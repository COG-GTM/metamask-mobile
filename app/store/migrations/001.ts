import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 1: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const tokens = typedState.engine.backgroundState.TokensController.tokens;
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
  typedState.engine.backgroundState.TokensController.tokens = migratedTokens;

  return typedState;
}
