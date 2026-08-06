import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworksData from './migration-data/amibiguous-networks.json';
import { ensureValidState } from './util';

const ambiguousNetworks: Record<string, { chainIds: string[] } | undefined> =
  ambiguousNetworksData;

const isMissingChainId = (value: unknown) =>
  !isObject(value) || !hasProperty(value, 'chainId');

const keysOf = (value: unknown) => Object.keys(isObject(value) ? value : {});

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
 * @param state - Redux state
 * @returns Migrated Redux state
 */
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 23)) {
    return state;
  }

  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      // We are not returning state not to stop the flow of Vault recovery
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    state.engine.backgroundState.AddressBookController;

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
  }

  const { networkConfigurations } = networkControllerState;
  const invalidNetworkConfiguration = Object.entries(
    networkConfigurations,
  ).find(([_networkConfigId, networkConfiguration]) =>
    isMissingChainId(networkConfiguration),
  );

  if (invalidNetworkConfiguration) {
    const [invalidConfigurationId, invalidConfiguration] =
      invalidNetworkConfiguration;
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${keysOf(
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
  }

  const { addressBook } = addressBookControllerState;
  const invalidAddressEntries = Object.entries(addressBook).find(
    ([_networkId, addressEntries]) => !isObject(addressEntries),
  );

  if (invalidAddressEntries) {
    const [networkId, invalidEntries] = invalidAddressEntries;
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  }

  const addressEntriesMissingChainId = Object.entries(addressBook).find(
    ([_networkId, addressEntries]) =>
      isObject(addressEntries) &&
      Object.values(addressEntries).some((addressEntry) =>
        isMissingChainId(addressEntry),
      ),
  );

  if (addressEntriesMissingChainId) {
    const [networkId, invalidEntries] = addressEntriesMissingChainId;
    const invalidEntry = isObject(invalidEntries)
      ? Object.values(invalidEntries).find((addressEntry) =>
          isMissingChainId(addressEntry),
        )
      : undefined;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${keysOf(
          invalidEntry,
        )}'`,
      ),
    );
    return state;
  }

  const userState = hasProperty(state, 'user') ? state.user : undefined;

  if (!isObject(userState)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof userState}'`),
    );
    return state;
  }

  const localChainIds = new Set<unknown>();
  for (const networkConfiguration of Object.values(networkConfigurations)) {
    if (isObject(networkConfiguration)) {
      localChainIds.add(networkConfiguration.chainId);
    }
  }
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
    if (ambiguousNetwork && isObject(addressEntries)) {
      const recognizedChainIdCandidates = ambiguousNetwork.chainIds.filter(
        (chainId) => localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries);
        }
        migratedAddressBook[chainId] = mapValues(addressEntries, (entry) => ({
          ...(isObject(entry) ? entry : {}),
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
    userState.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
