import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';

import { ExcludedSnapEndowments, ExcludedSnapPermissions } from '../../../Snaps';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import type { NotificationArgs } from '@metamask/snaps-rpc-methods/dist/restricted/notify.cjs';
import type { EnumToUnion, DialogType } from '@metamask/snaps-sdk';
import type { HdKeyring } from '@metamask/eth-hd-keyring';
import { KeyringTypes } from '@metamask/keyring-controller';
import { handleSnapRequest } from '../../../Snaps/utils';
import type { HandleSnapRequestArgs } from '../../../Snaps/types';
import Logger from '../../../../util/Logger';
import I18n from '../../../../../locales/i18n';
import { pbkdf2 } from '../../../Encryptor';
import {
  SnapControllerClearSnapStateAction,
  SnapControllerGetSnapAction,
  SnapControllerGetSnapStateAction,
  SnapControllerUpdateSnapStateAction,
} from '../snaps';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { keyringSnapPermissionsBuilder } from '../../../SnapKeyring/keyringSnapsPermissions';
///: END:ONLY_INCLUDE_IF

import type { ControllerByName, ControllerName } from '../../types';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import type { PermissionControllerInitMessenger } from '../../messengers/permission-controller-messenger';
///: END:ONLY_INCLUDE_IF

type GetController = <Name extends ControllerName>(
  name: Name,
) => ControllerByName[Name];

export type GetSnapPermissionSpecificationsDeps = {
  getController: GetController;
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  initMessenger: PermissionControllerInitMessenger;
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getSnapKeyring: () => Promise<unknown>;
  ///: END:ONLY_INCLUDE_IF
};

/**
 * Build the snap permission specifications for the PermissionController.
 *
 * Controllers are retrieved lazily via `getController` so that the returned
 * closures can be invoked after controller initialization completes.
 *
 * @param deps - The dependencies needed to build the specifications.
 * @returns The combined snap endowment and restricted method specifications.
 */
export const getSnapPermissionSpecifications = (
  deps: GetSnapPermissionSpecificationsDeps,
) => {
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  const { getController, initMessenger } = deps;

  /**
   * Gets the mnemonic of the user's primary keyring.
   */
  const getPrimaryKeyringMnemonic = () => {
    const [keyring] = getController('KeyringController').getKeyringsByType(
      KeyringTypes.hd,
    ) as HdKeyring[];

    if (!keyring.mnemonic) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyring.mnemonic;
  };

  const getPrimaryKeyringMnemonicSeed = () => {
    const [keyring] = getController('KeyringController').getKeyringsByType(
      KeyringTypes.hd,
    ) as HdKeyring[];

    if (!keyring.seed) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return keyring.seed;
  };

  const getUnlockPromise = () => {
    if (getController('KeyringController').isUnlocked()) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      initMessenger.subscribeOnceIf(
        'KeyringController:unlock',
        resolve,
        () => true,
      );
    });
  };

  const snapRestrictedMethods = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    clearSnapState: initMessenger.call.bind(
      initMessenger,
      SnapControllerClearSnapStateAction,
    ),
    getMnemonic: async (source?: string) => {
      if (!source) {
        return getPrimaryKeyringMnemonic();
      }

      try {
        const { type, mnemonic } = (await initMessenger.call(
          'KeyringController:withKeyring',
          {
            id: source,
          },
          async ({ keyring }) => ({
            type: keyring.type,
            mnemonic: (keyring as unknown as HdKeyring).mnemonic,
          }),
        )) as { type: string; mnemonic?: Uint8Array };

        if (type !== KeyringTypes.hd || !mnemonic) {
          // The keyring isn't guaranteed to have a mnemonic (e.g.,
          // hardware wallets, which can't be used as entropy sources),
          // so we throw an error if it doesn't.
          throw new Error(`Entropy source with ID "${source}" not found.`);
        }

        return mnemonic;
      } catch {
        throw new Error(`Entropy source with ID "${source}" not found.`);
      }
    },
    getMnemonicSeed: async (source?: string) => {
      if (!source) {
        return getPrimaryKeyringMnemonicSeed();
      }

      try {
        const { type, seed } = (await initMessenger.call(
          'KeyringController:withKeyring',
          {
            id: source,
          },
          async ({ keyring }) => ({
            type: keyring.type,
            seed: (keyring as unknown as HdKeyring).seed,
          }),
        )) as { type: string; seed?: Uint8Array };

        if (type !== KeyringTypes.hd || !seed) {
          // The keyring isn't guaranteed to have a seed (e.g.,
          // hardware wallets, which can't be used as entropy sources),
          // so we throw an error if it doesn't.
          throw new Error(`Entropy source with ID "${source}" not found.`);
        }

        return seed;
      } catch {
        throw new Error(`Entropy source with ID "${source}" not found.`);
      }
    },
    getUnlockPromise,
    getSnap: initMessenger.call.bind(
      initMessenger,
      SnapControllerGetSnapAction,
    ),
    handleSnapRpcRequest: async (args: HandleSnapRequestArgs) =>
      await handleSnapRequest(initMessenger, args),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getSnapState: initMessenger.call.bind(
      initMessenger,
      SnapControllerGetSnapStateAction,
    ),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    updateSnapState: initMessenger.call.bind(
      initMessenger,
      SnapControllerUpdateSnapStateAction,
    ),
    maybeUpdatePhishingList: initMessenger.call.bind(
      initMessenger,
      'PhishingController:maybeUpdateState',
    ),
    isOnPhishingList: (origin: string) =>
      initMessenger.call<'PhishingController:testOrigin'>(
        'PhishingController:testOrigin',
        origin,
      ).result,
    showDialog: (
      origin: string,
      type: EnumToUnion<DialogType>,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: any, // should be Component from '@metamask/snaps-ui';
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      placeholder?: any,
    ) =>
      getController('ApprovalController').addAndShowApprovalRequest({
        origin,
        type,
        requestData: { content, placeholder },
      }),
    showInAppNotification: (origin: string, args: NotificationArgs) => {
      Logger.log(
        'Snaps/ showInAppNotification called with args: ',
        args,
        ' and origin: ',
        origin,
      );
    },
    createInterface: initMessenger.call.bind(
      initMessenger,
      'SnapInterfaceController:createInterface',
    ),
    getInterface: initMessenger.call.bind(
      initMessenger,
      'SnapInterfaceController:getInterface',
    ),
    updateInterface: initMessenger.call.bind(
      initMessenger,
      'SnapInterfaceController:updateInterface',
    ),
    requestUserApproval: (
      ...args: Parameters<
        ControllerByName['ApprovalController']['addAndShowApprovalRequest']
      >
    ) => getController('ApprovalController').addAndShowApprovalRequest(...args),
    hasPermission: (origin: string, target: string) =>
      initMessenger.call<'PermissionController:hasPermission'>(
        'PermissionController:hasPermission',
        origin,
        target,
      ),
    getClientCryptography: () => ({ pbkdf2Sha512: pbkdf2 }),
    getPreferences: () => {
      const {
        securityAlertsEnabled,
        useTransactionSimulations,
        useTokenDetection,
        privacyMode,
        useNftDetection,
        displayNftMedia,
        isMultiAccountBalancesEnabled,
      } = getController('PreferencesController').state;
      const locale = I18n.locale;
      return {
        locale,
        currency: getController('CurrencyRateController').state.currentCurrency,
        hideBalances: privacyMode,
        useSecurityAlerts: securityAlertsEnabled,
        simulateOnChainActions: useTransactionSimulations,
        useTokenDetection,
        batchCheckBalances: isMultiAccountBalancesEnabled,
        displayNftMedia,
        useNftDetection,
        useExternalPricingData: true,
      };
    },
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const keyringSnapMethods = {
    getAllowedKeyringMethods: (origin: string) =>
      keyringSnapPermissionsBuilder(origin),
    getSnapKeyring: deps.getSnapKeyring,
  };
  ///: END:ONLY_INCLUDE_IF

  return {
    ...buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
    ...buildSnapRestrictedMethodSpecifications(
      Object.keys(ExcludedSnapPermissions),
      {
        ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
        ...snapRestrictedMethods,
        ///: END:ONLY_INCLUDE_IF
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        ...keyringSnapMethods,
        ///: END:ONLY_INCLUDE_IF
      },
    ),
  };
};
