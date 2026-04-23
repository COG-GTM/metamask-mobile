import {
  KeyringController,
  KeyringControllerState,
} from '@metamask/keyring-controller';
import { HdKeyring } from '@metamask/eth-hd-keyring';
import { MetaMaskKeyring as QRHardwareKeyring } from '@keystonehq/metamask-airgapped-keyring';
import {
  LedgerKeyring,
  LedgerMobileBridge,
  LedgerTransportMiddleware,
} from '@metamask/eth-ledger-bridge-keyring';
import { Encryptor, LEGACY_DERIVATION_OPTIONS, pbkdf2 } from '../../../Encryptor';
import type { ControllerInitFunction } from '../../types';
import type { KeyringControllerMessenger } from '../../messengers/keyring-controller-messenger';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { snapKeyringBuilder } from '../../../SnapKeyring';
import { removeAccountsFromPermissions } from '../../../Permissions';
import { toHex } from '@metamask/controller-utils';
import { BaseControllerMessenger } from '../../types';
import {
  SnapControllerGetSnapAction,
} from '../snaps';
///: END:ONLY_INCLUDE_IF

const encryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});

/**
 * Initialize the KeyringController.
 *
 * @param request - The request object.
 * @returns The KeyringController.
 */
export const keyringControllerInit: ControllerInitFunction<
  KeyringController,
  KeyringControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const preferencesController = request.getController('PreferencesController');

  const additionalKeyrings = [];

  const qrKeyringBuilder = () => {
    const keyring = new QRHardwareKeyring();
    keyring.forgetDevice();
    return keyring;
  };
  qrKeyringBuilder.type = QRHardwareKeyring.type;
  additionalKeyrings.push(qrKeyringBuilder);

  const bridge = new LedgerMobileBridge(new LedgerTransportMiddleware());
  const ledgerKeyringBuilder = () => new LedgerKeyring({ bridge });
  ledgerKeyringBuilder.type = LedgerKeyring.type;
  additionalKeyrings.push(ledgerKeyringBuilder);

  const hdKeyringBuilder = () =>
    new HdKeyring({
      cryptographicFunctions: { pbkdf2Sha512: pbkdf2 },
    });
  hdKeyringBuilder.type = HdKeyring.type;
  additionalKeyrings.push(hdKeyringBuilder);

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const baseControllerMessenger =
    controllerMessenger as unknown as BaseControllerMessenger;
  const snapKeyringBuildMessenger = baseControllerMessenger.getRestricted({
    name: 'SnapKeyring',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'ApprovalController:startFlow',
      'ApprovalController:endFlow',
      'ApprovalController:showSuccess',
      'ApprovalController:showError',
      'PhishingController:testOrigin',
      'PhishingController:maybeUpdateState',
      'KeyringController:getAccounts',
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:setAccountNameAndSelectAccount',
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      SnapControllerGetSnapAction,
    ],
    allowedEvents: [],
  });

  // We need access to the keyringController instance for the snap keyring builder callbacks.
  // This variable will be set after the controller is created.
  let keyringControllerRef: KeyringController | undefined;

  additionalKeyrings.push(
    snapKeyringBuilder(snapKeyringBuildMessenger, {
      persistKeyringHelper: async () => {
        await keyringControllerRef?.persistAllKeyrings();
      },
      removeAccountHelper: async (address) => {
        const addressHex = toHex(address);
        // Remove all associated permissions
        await removeAccountsFromPermissions([addressHex]);
        // Remove account from the keyring
        await keyringControllerRef?.removeAccount(addressHex);
      },
    }),
  );
  ///: END:ONLY_INCLUDE_IF

  const controller = new KeyringController({
    removeIdentity: preferencesController.removeIdentity.bind(
      preferencesController,
    ),
    encryptor,
    messenger: controllerMessenger,
    state: persistedState.KeyringController as KeyringControllerState,
    // @ts-expect-error To Do: Update the type of QRHardwareKeyring to Keyring<Json>
    keyringBuilders: additionalKeyrings,
    cacheEncryptionKey: true,
  });

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  keyringControllerRef = controller;
  ///: END:ONLY_INCLUDE_IF

  return { controller };
};
