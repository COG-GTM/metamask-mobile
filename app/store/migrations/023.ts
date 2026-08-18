import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface AmbiguousNetwork {
  chainIds: string[];
}

type AmbiguousNetworks = Record<string, AmbiguousNetwork>;
type AddressBookEntry = Record<string, unknown> & { chainId: string };
type AddressEntries = Record<string, AddressBookEntry>;
type AddressBook = Record<string, AddressEntries>;

interface NetworkConfiguration {
  chainId: string;
  [key: string]: unknown;
}

interface NetworkControllerState {
  networkConfigurations: Record<string, NetworkConfiguration>;
}

interface AddressBookControllerState {
  addressBook: AddressBook;
}

interface UserState {
  ambiguousAddressEntries?: Record<string, string[]>;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      NetworkController?: NetworkControllerState;
      AddressBookController?: AddressBookControllerState;
    };
  };
  user: UserState;
}

/**
 * Migrate address book state to be keyed by chain ID rather than network ID.
 *
 * When choosing which chain ID to migrate each address book entry to, we
 * consider only networks that the user has configured locally. Any entries
 * for chains not configured locally are discarded.
 *
 * If there are multiple chain ID candidates for a given network ID (even
 * after filtering to include just locally configured networks), address
 * entries are duplicated on all potentially matching chains. These cases are
 * also stored in the `user.ambiguousAddressEntries` state so that we can
 * warn the user in the UI about these addresses.
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const keyringControllerState =
    typedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = typedState.engine.backgroundState
    .NetworkController as NetworkControllerState;
  const addressBookControllerState = typedState.engine.backgroundState
    .AddressBookController as AddressBookControllerState;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return typedState;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return typedState;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration) => !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !hasProperty(networkConfiguration, 'chainId'),
    ) as [string, NetworkConfiguration];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration,
        )}'`,
      ),
    );
    return typedState;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return typedState;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return typedState;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries)) as [
      string,
      AddressEntries,
    ];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return typedState;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries).some(
          (addressEntry) => !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries).some(
        (addressEntry) => !hasProperty(addressEntry, 'chainId'),
      ),
    ) as [string, AddressEntries];
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) => !hasProperty(addressEntry, 'chainId'),
    ) as AddressBookEntry;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry,
        )}'`,
      ),
    );
    return typedState;
  } else if (!isObject(typedState.user)) {
    captureException(
      new Error(
        `Migration 23: Invalid user state: '${typeof typedState.user}'`,
      ),
    );
    return typedState;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce<Set<string>>((customChainIds, networkConfiguration) => {
    customChainIds.add(networkConfiguration.chainId);
    return customChainIds;
  }, new Set());
  const builtInNetworkChainIdsAsOfMigration22 = [
    '1',
    '5',
    '11155111',
    '59140',
    '59144',
  ];
  for (const builtInChainId of builtInNetworkChainIdsAsOfMigration22) {
    localChainIds.add(builtInChainId);
  }

  const migratedAddressBook: AddressBook = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  const typedAmbiguousNetworks = ambiguousNetworks as AmbiguousNetworks;
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if (typedAmbiguousNetworks[networkId]) {
      const chainIdCandidates = typedAmbiguousNetworks[networkId].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries);
        }
        migratedAddressBook[chainId] = mapValues(addressEntries, (entry) => ({
          ...entry,
          chainId,
        }));
      }
    } else {
      migratedAddressBook[networkId] = addressEntries;
    }
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    typedState.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return typedState;
}
