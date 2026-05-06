import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface AddressBookEntry {
  address?: string;
  chainId?: string;
  name?: string;
  memo?: string;
  isEns?: boolean;
  [key: string]: unknown;
}

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
export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: {
      backgroundState: {
        KeyringController?: unknown;
        NetworkController?: unknown;
        AddressBookController?: unknown;
      };
    };
    user?: { ambiguousAddressEntries?: Record<string, string[]> };
  };
  const keyringControllerState =
    typedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
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
      (networkConfiguration) =>
        !hasProperty(
          networkConfiguration as Record<string, unknown>,
          'chainId',
        ),
    )
  ) {
    const found = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([, networkConfiguration]) =>
        !hasProperty(
          networkConfiguration as Record<string, unknown>,
          'chainId',
        ),
    );
    const invalidConfigurationId = found?.[0] ?? '';
    const invalidConfiguration = (found?.[1] ?? {}) as Record<string, unknown>;
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
    const found = Object.entries(addressBookControllerState.addressBook).find(
      ([, addressEntries]) => !isObject(addressEntries),
    );
    const networkId = found?.[0] ?? '';
    const invalidEntries = found?.[1];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries as Record<string, AddressBookEntry>).some(
          (addressEntry) => !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const found = Object.entries(addressBookControllerState.addressBook).find(
      ([, addressEntries]) =>
        Object.values(addressEntries as Record<string, AddressBookEntry>).some(
          (addressEntry) => !hasProperty(addressEntry, 'chainId'),
        ),
    );
    const networkId = found?.[0] ?? '';
    const invalidEntries =
      (found?.[1] as Record<string, AddressBookEntry>) ?? {};
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) => !hasProperty(addressEntry, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry ?? {},
        )}'`,
      ),
    );
    return state;
  } else if (!isObject(typedState.user)) {
    captureException(
      new Error(
        `Migration 23: Invalid user state: '${typeof typedState.user}'`,
      ),
    );
    return state;
  }

  const networkConfigurations =
    networkControllerState.networkConfigurations as Record<
      string,
      { chainId: string }
    >;
  const localChainIds = Object.values(networkConfigurations).reduce<
    Set<string>
  >((customChainIds, networkConfiguration) => {
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

  const addressBook = addressBookControllerState.addressBook as Record<
    string,
    Record<string, AddressBookEntry>
  >;
  const migratedAddressBook: Record<
    string,
    Record<string, AddressBookEntry>
  > = {};
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

  addressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (typedState.user as { ambiguousAddressEntries?: Record<string, string[]> }).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return state;
}
