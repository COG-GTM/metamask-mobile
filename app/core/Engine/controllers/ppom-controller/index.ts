import Crypto from 'react-native-quick-crypto';
import { PPOMController } from '@metamask/ppom-validator';
import { PPOM, ppomInit } from '../../../../lib/ppom/PPOMView';
import RNFSStorageBackend from '../../../../lib/ppom/ppom-storage-backend';
import { getGlobalChainId } from '../../../../util/networks/global-network';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the PPOMController.
 *
 * @param request - The request object.
 * @returns The PPOMController.
 */
export const ppomControllerInit: ControllerInitFunction<
  PPOMController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const networkController = request.getController('NetworkController');
  const preferencesController = request.getController('PreferencesController');

  const controller = new PPOMController({
    chainId: getGlobalChainId(networkController),
    blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
    cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
    messenger: controllerMessenger,
    onPreferencesChange: (listener) =>
      controllerMessenger.subscribe(
        `PreferencesController:stateChange` as never,
        listener as never,
      ),
    // TODO: Replace "any" with type
    provider:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      networkController.getProviderAndBlockTracker().provider as any,
    ppomProvider: {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      PPOM: PPOM as any,
      ppomInit,
    },
    storageBackend: new RNFSStorageBackend('PPOMDB'),
    securityAlertsEnabled:
      persistedState.PreferencesController?.securityAlertsEnabled ?? false,
    state: persistedState.PPOMController,
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nativeCrypto: Crypto as any,
  });

  return { controller };
};
