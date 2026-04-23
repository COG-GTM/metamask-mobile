import { HdKeyring } from '@metamask/eth-hd-keyring';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import type { NotificationArgs } from '@metamask/snaps-rpc-methods/dist/restricted/notify.cjs';
import type { EnumToUnion, DialogType } from '@metamask/snaps-sdk';
///: END:ONLY_INCLUDE_IF
import { ApprovalController } from '@metamask/approval-controller';
import { pbkdf2 } from '../../Encryptor';
///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { HandleSnapRequestArgs } from '../../Snaps/types';
import { handleSnapRequest } from '../../Snaps/utils';
import {
  SnapControllerClearSnapStateAction,
  SnapControllerGetSnapAction,
  SnapControllerGetSnapStateAction,
  SnapControllerUpdateSnapStateAction,
} from '../controllers/snaps';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { keyringSnapPermissionsBuilder } from '../../SnapKeyring/keyringSnapsPermissions';
///: END:ONLY_INCLUDE_IF
import Logger from '../../../util/Logger';
import I18n from '../../../../locales/i18n';
import type { BaseControllerMessenger, EngineContext } from '../types';
import type { CurrencyRateController } from '@metamask/assets-controllers';

///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
export interface SnapRestrictedMethodsDeps {
  controllerMessenger: BaseControllerMessenger;
  approvalController: ApprovalController;
  getKeyringController: () => {
    isUnlocked: () => boolean;
    getKeyringsByType: (type: string) => unknown[];
  };
  getPreferences: () => {
    securityAlertsEnabled: boolean;
    useTransactionSimulations: boolean;
    useTokenDetection: boolean;
    privacyMode: boolean;
    useNftDetection: boolean;
    displayNftMedia: boolean;
    isMultiAccountBalancesEnabled: boolean;
  };
  getCurrencyRateControllerState: () => CurrencyRateController['state'];
  getPrimaryKeyringMnemonic: () => Uint8Array;
  getPrimaryKeyringMnemonicSeed: () => Uint8Array;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSnapRestrictedMethods(deps: SnapRestrictedMethodsDeps): Record<string, any> {
  const {
    controllerMessenger,
    approvalController,
    getKeyringController,
    getPreferences,
    getCurrencyRateControllerState,
    getPrimaryKeyringMnemonic,
    getPrimaryKeyringMnemonicSeed,
  } = deps;

  const getUnlockPromise = () => {
    if (getKeyringController().isUnlocked()) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      controllerMessenger.subscribeOnceIf(
        'KeyringController:unlock',
        resolve,
        () => true,
      );
    });
  };

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

        if (type !== 'HD Key Tree' || !mnemonic) {
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

        if (type !== 'HD Key Tree' || !seed) {
          throw new Error(`Entropy source with ID "${source}" not found.`);
        }

        return seed;
      } catch {
        throw new Error(`Entropy source with ID "${source}" not found.`);
      }
    },
    getUnlockPromise: getUnlockPromise.bind(null),
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
      content: any,
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
        currency: getCurrencyRateControllerState().currentCurrency,
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
export interface KeyringSnapMethodsDeps {
  getSnapKeyring: () => Promise<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildKeyringSnapMethods(deps: KeyringSnapMethodsDeps): Record<string, any> {
  return {
    getAllowedKeyringMethods: (origin: string) =>
      keyringSnapPermissionsBuilder(origin),
    getSnapKeyring: deps.getSnapKeyring,
  };
}
///: END:ONLY_INCLUDE_IF
