import { PPOMController } from '@metamask/ppom-validator';
import { PPOM, ppomInit } from '../../../../lib/ppom/PPOMView';
import RNFSStorageBackend from '../../../../lib/ppom/ppom-storage-backend';
import Crypto from 'react-native-quick-crypto';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitFunction,
} from '../../types';

/**
 * Initialize the PPOMController.
 *
 * @param request - The request object.
 * @returns The PPOMController.
 */
export const ppomControllerInit: ControllerInitFunction<
  PPOMController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const {
    controllerMessenger,
    persistedState,
    getController,
    getGlobalChainId,
  } = request;

  const networkController = getController('NetworkController');

  const controller = new PPOMController({
    chainId: getGlobalChainId(),
    blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
    cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    messenger: controllerMessenger,
    onPreferencesChange: (listener) =>
      (
        controllerMessenger as unknown as {
          subscribe: (event: string, handler: typeof listener) => void;
        }
      ).subscribe('PreferencesController:stateChange', listener),
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
    state: persistedState.PPOMController as PPOMController['state'] | undefined,
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nativeCrypto: Crypto as any,
  });

  return { controller };
};
