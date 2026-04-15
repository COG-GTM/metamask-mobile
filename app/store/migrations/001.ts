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
      new Error(`Migration 1: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(`Migration 1: Invalid engine state: '${typeof state.engine}'`),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 1: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.TokensController)) {
    captureException(
      new Error(
        `Migration 1: Invalid TokensController state: '${typeof state.engine
          .backgroundState.TokensController}'`,
      ),
    );
    return state;
  }

  const tokens = state.engine.backgroundState.TokensController.tokens as Array<
    Record<string, unknown>
  >;
  const migratedTokens: Array<Record<string, unknown>> = [];
  tokens.forEach((token) => {
    if (
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address as string, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  state.engine.backgroundState.TokensController.tokens = migratedTokens;

  return state;
}
