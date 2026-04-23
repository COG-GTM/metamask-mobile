import { PPOMController } from '@metamask/ppom-validator';
import { PPOM, ppomInit } from '../../../../lib/ppom/PPOMView';
import RNFSStorageBackend from '../../../../lib/ppom/ppom-storage-backend';
import Crypto from 'react-native-quick-crypto';
import { getGlobalChainId } from '../../../../util/networks/global-network';
import type {
  ControllerInitFunction,
  ControllerInitRequest,
  BaseRestrictedControllerMessenger,
  BaseControllerMessenger,
} from '../../types';

type PPOMControllerMessenger = ReturnType<
  typeof import('../../messengers/ppom-controller-messenger').getPPOMControllerMessenger
>;

/**
 * Initialize the PPOMController.
 *
 * @param request - The request object.
 * @returns The PPOMController.
 */
export const ppomControllerInit: ControllerInitFunction<
  PPOMController,
  PPOMControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const { networkController, preferencesController } = getControllers(request);

  const controller = new PPOMController({
    chainId: getGlobalChainId(networkController),
    blockaidPublicKey: process.env.BLOCKAID_PUBLIC_KEY as string,
    cdnBaseUrl: process.env.BLOCKAID_FILE_CDN as string,
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    messenger: controllerMessenger,
    onPreferencesChange: (listener) =>
      (controllerMessenger as unknown as BaseControllerMessenger).subscribe(
        `${preferencesController.name}:stateChange`,
        listener,
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

function getControllers(
  request: ControllerInitRequest<PPOMControllerMessenger>,
) {
  return {
    networkController: request.getController('NetworkController'),
    preferencesController: request.getController('PreferencesController'),
  };
}
