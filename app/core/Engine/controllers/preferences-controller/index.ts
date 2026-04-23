import { PreferencesController } from '@metamask/preferences-controller';
import AppConstants from '../../../AppConstants';
import type { ControllerInitFunction, BaseRestrictedControllerMessenger } from '../../types';

/**
 * Initialize the PreferencesController.
 *
 * @param request - The request object.
 * @returns The PreferencesController.
 */
export const preferencesControllerInit: ControllerInitFunction<
  PreferencesController,
  BaseRestrictedControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new PreferencesController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: {
      ipfsGateway: AppConstants.IPFS_DEFAULT_GATEWAY_URL,
      useTokenDetection:
        persistedState?.PreferencesController?.useTokenDetection ?? true,
      useNftDetection: true,
      displayNftMedia: true,
      securityAlertsEnabled: true,
      smartTransactionsOptInStatus: true,
      tokenSortConfig: {
        key: 'tokenFiatAmount',
        order: 'dsc',
        sortCallback: 'stringNumeric',
      },
      ...persistedState.PreferencesController,
    },
  });

  return { controller };
};
