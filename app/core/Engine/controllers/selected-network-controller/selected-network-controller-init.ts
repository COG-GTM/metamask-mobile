import {
  SelectedNetworkController,
  type SelectedNetworkControllerMessenger,
} from '@metamask/selected-network-controller';
import DomainProxyMap from '../../../../lib/DomainProxyMap/DomainProxyMap';
import type { ControllerInitFunction } from '../../types';

export const selectedNetworkControllerInit: ControllerInitFunction<
  SelectedNetworkController,
  SelectedNetworkControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SelectedNetworkController({
    messenger: controllerMessenger,
    state: persistedState.SelectedNetworkController || { domains: {} },
    useRequestQueuePreference: !!process.env.MULTICHAIN_V1,
    // TODO we need to modify core PreferencesController for better cross client support
    onPreferencesStateChange: (
      listener: ({ useRequestQueue }: { useRequestQueue: boolean }) => void,
    ) => listener({ useRequestQueue: !!process.env.MULTICHAIN_V1 }),
    domainProxyMap: new DomainProxyMap(),
  });

  return { controller };
};
