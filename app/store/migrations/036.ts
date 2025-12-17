import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { getUUIDFromAddressOfNormalAccount } from '@metamask/accounts-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { ETH_EOA_METHODS } from '../../constants/eth-methods';

export interface Identity {
  name: string;
  address: string;
  lastSelected?: number;
  importTime?: number;
}

/**
 * State structure for migration 036 (before AccountsController is created)
 */
interface Migration036StateInput {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      PreferencesController?: {
        identities?: Record<string, Identity>;
        selectedAddress?: string;
      };
      AccountsController?: {
        internalAccounts: {
          accounts: Record<string, InternalAccount>;
          selectedAccount: string;
        };
      };
    };
  };
}

/**
 * State structure for migration 036 (after AccountsController is created)
 */
interface Migration036State {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      PreferencesController?: {
        identities?: Record<string, Identity>;
        selectedAddress?: string;
      };
      AccountsController: {
        internalAccounts: {
          accounts: Record<string, InternalAccount>;
          selectedAccount: string;
        };
      };
    };
  };
}

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 36: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 36: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 36: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }

  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 36: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(
        `Migration 36: Invalid PreferencesController state: '${typeof state
          .engine.backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }
  if (
    !hasProperty(
      state.engine.backgroundState.PreferencesController,
      'identities',
    )
  ) {
    captureException(
      new Error(
        `Migration 36: Missing identities property from PreferencesController: '${typeof state
          .engine.backgroundState.PreferencesController}'`,
      ),
    );
    return state;
  }
  const typedState = state as unknown as Migration036StateInput;
  createDefaultAccountsController(typedState);
  const stateWithAccounts = typedState as Migration036State;
  createInternalAccountsForAccountsController(stateWithAccounts);
  createSelectedAccountForAccountsController(stateWithAccounts);
  return state;
}

function createDefaultAccountsController(state: Migration036StateInput) {
  state.engine.backgroundState.AccountsController = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };
}

function createInternalAccountsForAccountsController(
  state: Migration036State,
) {
  const identities: {
    [key: string]: Identity;
  } = state.engine.backgroundState.PreferencesController?.identities || {};

  if (Object.keys(identities).length === 0) {
    captureException(
      new Error(`Migration 36: PreferencesController?.identities are empty'`),
    );
    return;
  }

  const accounts: Record<string, InternalAccount> = {};

  for (const identity of Object.values(identities)) {
    const lowerCaseAddress = identity.address.toLocaleLowerCase();
    const expectedId = getUUIDFromAddressOfNormalAccount(lowerCaseAddress);

    accounts[expectedId] = {
      address: identity.address,
      scopes: [EthScope.Eoa],
      id: expectedId,
      options: {},
      metadata: {
        name: identity.name,
        importTime: identity.importTime ?? Date.now(),
        lastSelected: identity.lastSelected ?? undefined,
        keyring: {
          // This is default HD Key Tree type because the keyring is encrypted
          // during migration, the type will get updated when the during the
          // initial updateAccounts call.
          type: KeyringTypes.hd,
        },
      },
      methods: ETH_EOA_METHODS,

      type: EthAccountType.Eoa,
    };
  }
  state.engine.backgroundState.AccountsController.internalAccounts.accounts =
    accounts;
}

function findInternalAccountByAddress(
  state: Migration036State,
  address: string,
): InternalAccount | undefined {
  return Object.values<InternalAccount>(
    state.engine.backgroundState.AccountsController.internalAccounts.accounts,
  ).find(
    (account: InternalAccount) =>
      account.address.toLowerCase() === address.toLowerCase(),
  );
}

function createSelectedAccountForAccountsController(
  state: Migration036State,
) {
  const selectedAddress =
    state.engine.backgroundState.PreferencesController?.selectedAddress;

  // Handle the case where the selectedAddress from preferences controller is either not defined or not a string
  if (!selectedAddress || typeof selectedAddress !== 'string') {
    captureException(
      new Error(
        `Migration 36: Invalid selectedAddress. state.engine.backgroundState.PreferencesController?.selectedAddress is not a string:'${typeof selectedAddress}'. Setting selectedAddress to the first account.`,
      ),
    );
    // Get the first account if selectedAddress is not a string
    const identities =
      state.engine.backgroundState.PreferencesController?.identities;
    if (!identities) {
      return;
    }
    const [firstAddress] = Object.keys(identities);
    const internalAccount = findInternalAccountByAddress(state, firstAddress);

    if (internalAccount) {
      if (internalAccount.id === undefined) {
        captureException(
          new Error(
            `Migration 36: selectedAccount will be undefined because internalAccount.id is undefined.`,
          ),
        );
      }
      state.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
        internalAccount.id;
      if (state.engine.backgroundState.PreferencesController) {
        state.engine.backgroundState.PreferencesController.selectedAddress =
          internalAccount.address;
      }
    }
    return;
  }

  const selectedAccount = findInternalAccountByAddress(state, selectedAddress);
  if (selectedAccount) {
    if (selectedAccount.id === undefined) {
      captureException(
        new Error(
          `Migration 36: selectedAccount will be undefined because selectedAccount.id is undefined.`,
        ),
      );
    }
    state.engine.backgroundState.AccountsController.internalAccounts.selectedAccount =
      selectedAccount.id;
  }
}
