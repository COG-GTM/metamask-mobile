import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface AddressBookEntry {
  chainId?: string;
  [key: string]: unknown;
}

type AddressBook = Record<string, Record<string, AddressBookEntry>>;

interface Migration023State {
  engine: {
    backgroundState: Record<string, unknown>;
  };
  user?: unknown;
}

const ambiguousNetworksByNetworkId = ambiguousNetworks as Record<
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
export default function migrate(state: unknown) {
  const migratedState = state as Migration023State;
  const keyringControllerState =
    migratedState.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      // We are not returning state not to stop the flow of Vault recovery
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState =
    migratedState.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    migratedState.engine.backgroundState.AddressBookController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return migratedState;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return migratedState;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration) =>
        !hasProperty(
          networkConfiguration as Record<string, unknown>,
          'chainId',
        ),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !hasProperty(
          networkConfiguration as Record<string, unknown>,
          'chainId',
        ),
    ) as [string, Record<string, unknown>];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration,
        )}'`,
      ),
    );
    return migratedState;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return migratedState;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return migratedState;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries)) as [
      string,
      unknown,
    ];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return migratedState;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries as Record<string, unknown>).some(
          (addressEntry) =>
            !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries as Record<string, unknown>).some(
        (addressEntry) =>
          !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
      ),
    ) as [string, Record<string, unknown>];
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) =>
        !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
    ) as Record<string, unknown>;
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry,
        )}'`,
      ),
    );
    return migratedState;
  } else if (!isObject(migratedState.user)) {
    captureException(
      new Error(
        `Migration 23: Invalid user state: '${typeof migratedState.user}'`,
      ),
    );
    return migratedState;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce<Set<string>>((customChainIds, networkConfiguration) => {
    customChainIds.add((networkConfiguration as { chainId: string }).chainId);
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

  const migratedAddressBook: AddressBook = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook as AddressBook,
  )) {
    if (ambiguousNetworksByNetworkId[networkId]) {
      const chainIdCandidates =
        ambiguousNetworksByNetworkId[networkId].chainIds;
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
    migratedState.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return migratedState;
}
