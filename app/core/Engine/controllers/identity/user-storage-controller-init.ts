import {
  Controller as UserStorageController,
  UserStorageControllerMessenger,
} from '@metamask/profile-sync-controller/user-storage';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics, MetaMetricsEvents } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { calculateScryptKey } from './calculate-scrypt-key';
import { createUserStorageController } from './create-user-storage-controller';

/**
 * Initialize the UserStorageController.
 *
 * @param request - The request object.
 * @returns The UserStorageController.
 */
export const userStorageControllerInit: ControllerInitFunction<
  UserStorageController,
  UserStorageControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = createUserStorageController({
    messenger: controllerMessenger,
    initialState: persistedState.UserStorageController,
    nativeScryptCrypto: calculateScryptKey,
    config: {
      accountSyncing: {
        onAccountAdded: (profileId) => {
          MetaMetrics.getInstance().trackEvent(
            MetricsEventBuilder.createEventBuilder(
              MetaMetricsEvents.ACCOUNTS_SYNC_ADDED,
            )
              .addProperties({
                profile_id: profileId,
              })
              .build(),
          );
        },
        onAccountNameUpdated: (profileId) => {
          MetaMetrics.getInstance().trackEvent(
            MetricsEventBuilder.createEventBuilder(
              MetaMetricsEvents.ACCOUNTS_SYNC_NAME_UPDATED,
            )
              .addProperties({
                profile_id: profileId,
              })
              .build(),
          );
        },
        onAccountSyncErroneousSituation(profileId, situationMessage) {
          MetaMetrics.getInstance().trackEvent(
            MetricsEventBuilder.createEventBuilder(
              MetaMetricsEvents.ACCOUNTS_SYNC_ERRONEOUS_SITUATION,
            )
              .addProperties({
                profile_id: profileId,
                situation_message: situationMessage,
              })
              .build(),
          );
        },
      },
    },
  });

  return { controller };
};
