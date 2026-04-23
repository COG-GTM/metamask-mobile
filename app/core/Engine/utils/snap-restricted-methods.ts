///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import type { NotificationArgs } from '@metamask/snaps-rpc-methods/dist/restricted/notify.cjs';
import type { EnumToUnion, DialogType } from '@metamask/snaps-sdk';
import type { ApprovalController } from '@metamask/approval-controller';
import type { HdKeyring } from '@metamask/eth-hd-keyring';
import {
  KeyringTypes,
} from '@metamask/keyring-controller';
import { pbkdf2 } from '../../Encryptor';
import Logger from '../../../util/Logger';
import { HandleSnapRequestArgs } from '../../Snaps/types';
import { handleSnapRequest } from '../../Snaps/utils';
import {
  SnapControllerClearSnapStateAction,
  SnapControllerGetSnapAction,
  SnapControllerGetSnapStateAction,
  SnapControllerUpdateSnapStateAction,
} from '../controllers/snaps';
import I18n from '../../../../locales/i18n';
import type { BaseControllerMessenger, EngineContext } from '../types';

export interface SnapRestrictedMethodsDeps {
  controllerMessenger: BaseControllerMessenger;
  approvalController: ApprovalController;
  getPrimaryKeyringMnemonic: () => Uint8Array;
  getPrimaryKeyringMnemonicSeed: () => Uint8Array;
  getUnlockPromise: () => Promise<void>;
  getPreferences: () => {
    securityAlertsEnabled: boolean;
    useTransactionSimulations: boolean;
    useTokenDetection: boolean;
    privacyMode: boolean;
    useNftDetection: boolean;
    displayNftMedia: boolean;
    isMultiAccountBalancesEnabled: boolean;
  };
  getContext: () => EngineContext;
}

/**
 * Creates the snapRestrictedMethods object used to build snap permission specifications.
 *
 * @param deps - Dependencies needed to construct the restricted methods.
 * @returns The snapRestrictedMethods object.
 */
export function createSnapRestrictedMethods(deps: SnapRestrictedMethodsDeps) {
  const {
    controllerMessenger,
    approvalController,
    getPrimaryKeyringMnemonic,
    getPrimaryKeyringMnemonicSeed,
    getUnlockPromise,
    getPreferences,
    getContext,
  } = deps;

  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    clearSnapState: controllerMessenger.call.bind(
      controllerMessenger,
      SnapControllerClearSnapStateAction,
    ),
    getMnemonic: async (source?: string) => {
      if (!source) {
        return getPrimaryKeyringMnemonic();
      }

      try {
        const { type, mnemonic } = (await controllerMessenger.call(
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
        const { type, seed } = (await controllerMessenger.call(
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
          throw new Error(`Entropy source with ID "${source}" not found.`);
        }

        return seed;
      } catch {
        throw new Error(`Entropy source with ID "${source}" not found.`);
      }
    },
    getUnlockPromise,
    getSnap: controllerMessenger.call.bind(
      controllerMessenger,
      SnapControllerGetSnapAction,
    ),
    handleSnapRpcRequest: async (args: HandleSnapRequestArgs) =>
      await handleSnapRequest(controllerMessenger, args),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getSnapState: controllerMessenger.call.bind(
      controllerMessenger,
      SnapControllerGetSnapStateAction,
    ),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    updateSnapState: controllerMessenger.call.bind(
      controllerMessenger,
      SnapControllerUpdateSnapStateAction,
    ),
    maybeUpdatePhishingList: controllerMessenger.call.bind(
      controllerMessenger,
      'PhishingController:maybeUpdateState',
    ),
    isOnPhishingList: (origin: string) =>
      controllerMessenger.call<'PhishingController:testOrigin'>(
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
      approvalController.addAndShowApprovalRequest({
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
    createInterface: controllerMessenger.call.bind(
      controllerMessenger,
      'SnapInterfaceController:createInterface',
    ),
    getInterface: controllerMessenger.call.bind(
      controllerMessenger,
      'SnapInterfaceController:getInterface',
    ),
    updateInterface: controllerMessenger.call.bind(
      controllerMessenger,
      'SnapInterfaceController:updateInterface',
    ),
    requestUserApproval:
      approvalController.addAndShowApprovalRequest.bind(approvalController),
    hasPermission: (origin: string, target: string) =>
      controllerMessenger.call<'PermissionController:hasPermission'>(
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
      } = getPreferences();
      const locale = I18n.locale;
      return {
        locale,
        currency: getContext().CurrencyRateController.state.currentCurrency,
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
}
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { keyringSnapPermissionsBuilder } from '../../SnapKeyring/keyringSnapsPermissions';

export interface KeyringSnapMethodsDeps {
  getSnapKeyring: () => Promise<unknown>;
}

/**
 * Creates the keyringSnapMethods object used for keyring snap permissions.
 *
 * @param deps - Dependencies needed to construct the keyring snap methods.
 * @returns The keyringSnapMethods object.
 */
export function createKeyringSnapMethods(deps: KeyringSnapMethodsDeps) {
  return {
    getAllowedKeyringMethods: (origin: string) =>
      keyringSnapPermissionsBuilder(origin),
    getSnapKeyring: deps.getSnapKeyring,
  };
}
///: END:ONLY_INCLUDE_IF
