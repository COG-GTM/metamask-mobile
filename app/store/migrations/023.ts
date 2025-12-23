import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface AddressEntry {
  chainId: string;
  [key: string]: unknown;
}

interface NetworkConfiguration {
  chainId: string;
  [key: string]: unknown;
}

interface AmbiguousNetworks {
  [key: string]: {
    chainIds: string[];
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
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = state.engine.backgroundState.NetworkController as Record<string, unknown> | undefined;
  const addressBookControllerState = state.engine.backgroundState.AddressBookController as Record<string, unknown> | undefined;

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
    Object.values(networkControllerState.networkConfigurations as Record<string, Record<string, unknown>>).some(
      (networkConfiguration) => !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    const result = Object.entries(
      networkControllerState.networkConfigurations as Record<string, Record<string, unknown>>,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !hasProperty(networkConfiguration, 'chainId'),
    );
    const invalidConfigurationId = result?.[0];
    const invalidConfiguration = result?.[1];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration || {},
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
    Object.values(addressBookControllerState.addressBook as Record<string, unknown>).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const result = Object.entries(
      addressBookControllerState.addressBook as Record<string, unknown>,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries));
    const networkId = result?.[0];
    const invalidEntries = result?.[1];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  } else if (
    Object.values(addressBookControllerState.addressBook as Record<string, Record<string, Record<string, unknown>>>).some(
      (addressEntries) =>
        Object.values(addressEntries).some(
          (addressEntry) => !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const result = Object.entries(
      addressBookControllerState.addressBook as Record<string, Record<string, Record<string, unknown>>>,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries).some(
        (addressEntry) => !hasProperty(addressEntry, 'chainId'),
      ),
    );
    const networkId = result?.[0];
    const invalidEntries = result?.[1] as Record<string, Record<string, unknown>> | undefined;
    const invalidEntry = Object.values(invalidEntries || {}).find(
      (addressEntry) => !hasProperty(addressEntry, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry || {},
        )}'`,
      ),
    );
    return state;
  } else if (!isObject(state.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof state.user}'`),
    );
    return state;
  }

  const networkConfigurations = networkControllerState.networkConfigurations as Record<string, NetworkConfiguration>;
  const addressBook = addressBookControllerState.addressBook as Record<string, Record<string, AddressEntry>>;
  const user = state.user as Record<string, unknown>;

  const localChainIds = Object.values(networkConfigurations).reduce(
    (customChainIds: Set<string>, networkConfiguration) => {
      customChainIds.add(networkConfiguration.chainId);
      return customChainIds;
    },
    new Set<string>(),
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

  const migratedAddressBook: Record<string, Record<string, AddressEntry>> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(addressBook)) {
    if ((ambiguousNetworks as AmbiguousNetworks)[networkId]) {
      const chainIdCandidates = (ambiguousNetworks as AmbiguousNetworks)[networkId].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId: string) =>
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
    user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
