import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 21: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 21: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 21: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 21: Invalid PreferencesController state: '${typeof state
          .engine.backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController = state.engine.backgroundState
    .PreferencesController as Record<string, unknown>;

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}
