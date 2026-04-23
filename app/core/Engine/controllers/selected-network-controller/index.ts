import { SelectedNetworkController } from '@metamask/selected-network-controller';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';
import DomainProxyMap from '../../../../lib/DomainProxyMap/DomainProxyMap';

/**
 * Initialize the SelectedNetworkController.
 *
 * @param request - The request object.
 * @returns The SelectedNetworkController.
 */
export const selectedNetworkControllerInit: ControllerInitFunction<
  SelectedNetworkController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SelectedNetworkController({
    messenger: controllerMessenger,
    state: persistedState.SelectedNetworkController || { domains: {} },
    useRequestQueuePreference: !!process.env.MULTICHAIN_V1,
    onPreferencesStateChange: (
      listener: ({ useRequestQueue }: { useRequestQueue: boolean }) => void,
    ) => listener({ useRequestQueue: !!process.env.MULTICHAIN_V1 }),
    domainProxyMap: new DomainProxyMap(),
  });

  return { controller };
};
