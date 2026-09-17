import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworksData from './migration-data/amibiguous-networks.json';

const ambiguousNetworks = ambiguousNetworksData as Record<
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
 **/
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState)
  ) {
    return state;
  }

  const { backgroundState } = state.engine;

  const keyringControllerState = backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = backgroundState.NetworkController;
  const addressBookControllerState = backgroundState.AddressBookController;

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
    ) ?? ['', {}];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration as object,
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
    ).find(([, addressEntries]) => !isObject(addressEntries)) ?? ['', undefined];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
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
    ) ?? ['', {}];
    const invalidEntry = isObject(invalidEntries)
      ? Object.values(invalidEntries).find(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        )
      : undefined;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry as object,
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

  const networkConfigurations: Record<string, unknown> =
    hasProperty(networkControllerState, 'networkConfigurations') &&
    isObject(networkControllerState.networkConfigurations)
      ? networkControllerState.networkConfigurations
      : {};
  const addressBook: Record<string, unknown> =
    hasProperty(addressBookControllerState, 'addressBook') &&
    isObject(addressBookControllerState.addressBook)
      ? addressBookControllerState.addressBook
      : {};

  const localChainIds = Object.values(networkConfigurations).reduce<
    Set<unknown>
  >((customChainIds, networkConfiguration) => {
    if (isObject(networkConfiguration)) {
      customChainIds.add(networkConfiguration.chainId);
    }
    return customChainIds;
  }, new Set<unknown>());
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

  const migratedAddressBook: Record<string, unknown> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(addressBook)) {
    const ambiguousNetwork = ambiguousNetworks[networkId];
    if (ambiguousNetwork) {
      const chainIdCandidates = ambiguousNetwork.chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1 && isObject(addressEntries)) {
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries);
        }
        migratedAddressBook[chainId] = mapValues(
          addressEntries as Record<string, Record<string, unknown>>,
          (entry) => ({
            ...entry,
            chainId,
          }),
        );
      }
    } else {
      migratedAddressBook[networkId] = addressEntries;
    }
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (
    isObject(state.user) &&
    Object.keys(ambiguousAddressEntries).length > 1
  ) {
    state.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
