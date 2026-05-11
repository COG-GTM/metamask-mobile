import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface NetworkConfiguration {
  chainId: string;
  [key: string]: unknown;
}

interface AddressEntry {
  chainId: string;
  [key: string]: unknown;
}

type AddressEntriesByAddress = Record<string, AddressEntry>;

const ambiguousNetworksMap = ambiguousNetworks as Record<
  string,
  { chainIds: string[] }
>;

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
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        KeyringController: unknown;
        NetworkController: unknown;
        AddressBookController: unknown;
      };
    };
    user?: { ambiguousAddressEntries?: Record<string, string[]> };
  };
  const keyringControllerState =
    typedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    // We are not returning state not to stop the flow of Vault recovery
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState =
    typedState.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    typedState.engine.backgroundState.AddressBookController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration) =>
        !isObject(networkConfiguration) ||
        !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([, networkConfiguration]) =>
        !isObject(networkConfiguration) ||
        !hasProperty(networkConfiguration, 'chainId'),
    ) as [string, Record<string, unknown>];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration,
        )}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([, addressEntries]) => !isObject(addressEntries)) as [
      string,
      unknown,
    ];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        isObject(addressEntries) &&
        Object.values(addressEntries).some(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(
      ([, addressEntries]) =>
        isObject(addressEntries) &&
        Object.values(addressEntries).some(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        ),
    ) as [string, Record<string, Record<string, unknown>>];
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) => !hasProperty(addressEntry, 'chainId'),
    ) as Record<string, unknown>;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry,
        )}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (!isObject(typedState.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof typedState.user}'`),
    );
    return state as Record<string, unknown>;
  }

  const networkConfigurations =
    networkControllerState.networkConfigurations as Record<
      string,
      NetworkConfiguration
    >;
  const addressBook = (
    addressBookControllerState as { addressBook: Record<string, AddressEntriesByAddress> }
  ).addressBook;

  const localChainIds = Object.values(networkConfigurations).reduce<Set<string>>(
    (customChainIds, networkConfiguration) => {
      customChainIds.add(networkConfiguration.chainId);
      return customChainIds;
    },
    new Set(),
  );
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

  const migratedAddressBook: Record<string, AddressEntriesByAddress> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(addressBook)) {
    if (ambiguousNetworksMap[networkId]) {
      const chainIdCandidates = ambiguousNetworksMap[networkId].chainIds;
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

  (
    addressBookControllerState as { addressBook: Record<string, AddressEntriesByAddress> }
  ).addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (typedState.user as { ambiguousAddressEntries?: Record<string, string[]> }).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return state as Record<string, unknown>;
}
