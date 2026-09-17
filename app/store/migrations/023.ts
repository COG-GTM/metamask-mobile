import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface NetworkConfiguration {
  chainId: string;
}

interface AddressBookEntry {
  chainId: string;
}

type AddressEntries = Record<string, AddressBookEntry>;

interface MigrationState {
  engine: {
    backgroundState: {
      KeyringController: unknown;
      NetworkController: {
        networkConfigurations: Record<string, NetworkConfiguration>;
      };
      AddressBookController: {
        addressBook: Record<string, AddressEntries>;
      };
    };
  };
  user: {
    ambiguousAddressEntries?: Record<string, string[]>;
  };
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
 * Note: the type is wrong here because it conflicts with `redux-persist`
 * types, due to a bug in that package.
 * See: https://github.com/rt2zz/redux-persist/issues/1065
 * TODO: Use `unknown` as the state type, and silence or work around the
 * redux-persist bug somehow.
 *
 **/
export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const knownAmbiguousNetworks = ambiguousNetworks as Record<
    string,
    { chainIds: string[] }
  >;
  const keyringControllerState =
    migrationState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      // We are not returning state not to stop the flow of Vault recovery
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState =
    migrationState.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    migrationState.engine.backgroundState.AddressBookController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return state;
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
    return state;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return state;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return state;
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
    return state;
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
    return state;
  } else if (!isObject(migrationState.user)) {
    captureException(
      new Error(
        `Migration 23: Invalid user state: '${typeof migrationState.user}'`,
      ),
    );
    return state;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce((customChainIds, networkConfiguration) => {
    customChainIds.add(networkConfiguration.chainId);
    return customChainIds;
  }, new Set<string>());
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

  const migratedAddressBook: Record<string, AddressEntries> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if (knownAmbiguousNetworks[networkId]) {
      const chainIdCandidates = knownAmbiguousNetworks[networkId].chainIds;
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
    migrationState.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
