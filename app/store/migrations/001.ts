import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';
import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 001: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.TokensController) ||
    !hasProperty(backgroundState.TokensController, 'tokens') ||
    !Array.isArray(backgroundState.TokensController.tokens)
  ) {
    return state as Record<string, unknown>;
  }

  const tokens = backgroundState.TokensController.tokens as Array<Record<string, unknown>>;
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
  (backgroundState.TokensController as Record<string, unknown>).tokens = migratedTokens;

  return state as Record<string, unknown>;
}
