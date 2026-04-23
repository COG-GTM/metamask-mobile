import { SelectedNetworkController } from '@metamask/selected-network-controller';
import DomainProxyMap from '../../../../lib/DomainProxyMap/DomainProxyMap';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: persistedState.SelectedNetworkController || { domains: {} },
    useRequestQueuePreference: !!process.env.MULTICHAIN_V1,
    onPreferencesStateChange: (
      listener: ({ useRequestQueue }: { useRequestQueue: boolean }) => void,
    ) => listener({ useRequestQueue: !!process.env.MULTICHAIN_V1 }),
    domainProxyMap: new DomainProxyMap(),
  });

  return { controller };
};
