import {
  PreferencesController,
  type PreferencesControllerMessenger,
} from '@metamask/preferences-controller';

import AppConstants from '../../../AppConstants';
import Logger from '../../../../util/Logger';
import type { ControllerInitFunction } from '../../types';

export const preferencesControllerInit: ControllerInitFunction<
  PreferencesController,
  PreferencesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  try {
    const preferencesController = new PreferencesController({
      messenger: controllerMessenger,
      state: {
        ipfsGateway: AppConstants.IPFS_DEFAULT_GATEWAY_URL,
        useTokenDetection:
          persistedState?.PreferencesController?.useTokenDetection ?? true,
        useNftDetection: true, // set this to true to enable nft detection by default to new users
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

    return { controller: preferencesController };
  } catch (error) {
    Logger.error(error as Error, 'Failed to initialize PreferencesController');
    throw error;
  }
};
