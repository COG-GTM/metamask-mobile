import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

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
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const bgState = state.engine.backgroundState;

  const keyringControllerState = bgState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = bgState.NetworkController;
  const addressBookControllerState = bgState.AddressBookController;

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
    const found = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !isObject(networkConfiguration) ||
        !hasProperty(networkConfiguration, 'chainId'),
    );
    const invalidConfigurationId = found?.[0];
    const invalidConfiguration = found?.[1] as Record<string, unknown>;
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
    const found = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries));
    const networkId = found?.[0];
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
        isObject(addressEntries) &&
        Object.values(addressEntries).some(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const found = Object.entries(
      addressBookControllerState.addressBook,
    ).find(
      ([_networkId, addressEntries]) =>
        isObject(addressEntries) &&
        Object.values(addressEntries).some(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        ),
    );
    const networkId = found?.[0];
    const invalidEntries = found?.[1] as Record<string, unknown>;
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) =>
        !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
    ) as Record<string, unknown>;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry,
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

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce((customChainIds: Set<unknown>, networkConfiguration) => {
    customChainIds.add(
      (networkConfiguration as Record<string, unknown>).chainId,
    );
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

  const ambiguousNetworksTyped = ambiguousNetworks as Record<
    string,
    { chainIds: string[] }
  >;

  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if (ambiguousNetworksTyped[networkId]) {
      const chainIdCandidates = ambiguousNetworksTyped[networkId].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter(
        (chainId: string) => localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(
            addressEntries as Record<string, unknown>,
          );
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
      migratedAddressBook[networkId] = addressEntries as Record<
        string,
        unknown
      >;
    }
  }

  (addressBookControllerState as Record<string, unknown>).addressBook =
    migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (state.user as Record<string, unknown>).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return state;
}
