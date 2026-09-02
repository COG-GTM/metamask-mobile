import { GOERLI } from '../../../app/constants/network';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

// Decimal chain id; migration 29 converts chain ids to hex.
const GOERLI_CHAIN_ID = '5';

/**
 * Migrate deprecated test networks to Goerli.
 * @param {unknown} state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 15: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 15: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 15: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  if (!isObject(backgroundState.NetworkController)) {
    captureException(
      new Error(
        `Migration 15: Invalid NetworkController state: '${typeof backgroundState.NetworkController}'`,
      ),
    );
    return state;
  }
  const networkController = backgroundState.NetworkController;
  if (!isObject(networkController.providerConfig)) {
    captureException(
      new Error(
        `Migration 15: Invalid providerConfig state: '${typeof networkController.providerConfig}'`,
      ),
    );
    return state;
  }
  const { chainId } = networkController.providerConfig;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
