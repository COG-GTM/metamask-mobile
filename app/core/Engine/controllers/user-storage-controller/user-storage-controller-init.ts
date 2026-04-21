import {
  UserStorageControllerMessenger,
  Controller as UserStorageController,
} from '@metamask/profile-sync-controller/user-storage';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics, MetaMetricsEvents } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { calculateScryptKey } from '../identity/calculate-scrypt-key';

export const userStorageControllerInit: ControllerInitFunction<
  UserStorageController,
  UserStorageControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new UserStorageController({
    messenger: controllerMessenger,
    state: persistedState.UserStorageController,
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
