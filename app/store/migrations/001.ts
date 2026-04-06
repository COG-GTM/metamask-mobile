import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

interface TokenEntry {
  symbol: string;
  address: string;
  [key: string]: unknown;
}

/**
 * MakerDAO DAI => SAI
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 1: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 1: Invalid engine state: '${typeof state.engine}'`,
      ),
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

  const tokensController = state.engine.backgroundState.TokensController;

  if (!Array.isArray(tokensController.tokens)) {
    captureException(
      new Error(
        `Migration 1: Missing TokensController tokens`,
      ),
    );
    return state;
  }

  const tokens = tokensController.tokens as TokenEntry[];
  const migratedTokens: TokenEntry[] = [];
  tokens.forEach((token) => {
    if (
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  tokensController.tokens = migratedTokens;

  return state;
}
