import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface TokenEntry {
  symbol: string;
  address: string;
}

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 001: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 001: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.TokensController)) {
    captureException(
      new Error(`Migration 001: Invalid TokensController state`),
    );
    return state;
  }

  const tokensController = backgroundState.TokensController as Record<
    string,
    unknown
  >;
  const tokens = tokensController.tokens as TokenEntry[];
  if (!Array.isArray(tokens)) {
    return state;
  }

  const migratedTokens: TokenEntry[] = [];
  tokens.forEach((token: TokenEntry) => {
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
