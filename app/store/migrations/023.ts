import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface Migration23State {
  engine: {
    backgroundState: {
      KeyringController: unknown;
      NetworkController: unknown;
      AddressBookController: unknown;
    };
  };
  user: unknown;
}

interface NetworkConfiguration {
  chainId: string;
  [key: string]: unknown;
}

interface NetworkControllerState {
  networkConfigurations: Record<string, NetworkConfiguration>;
}

interface AddressBookControllerState {
  addressBook: Record<string, Record<string, unknown>>;
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
  const typedState = state as Migration23State;
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
  const typedNetworkControllerState =
    networkControllerState as NetworkControllerState;
  const typedAddressBookControllerState =
    addressBookControllerState as AddressBookControllerState;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(typedNetworkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof typedNetworkControllerState.networkConfigurations}'`,
      ),
    );
    return state;
  } else if (
    Object.values(typedNetworkControllerState.networkConfigurations).some(
      (networkConfiguration) => !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      typedNetworkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !hasProperty(networkConfiguration, 'chainId'),
    ) as [string, Record<string, unknown>];
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
    !isObject(typedAddressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof typedAddressBookControllerState.addressBook}'`,
      ),
    );
    return state;
  } else if (
    Object.values(typedAddressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      typedAddressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries)) as [
      string,
      Record<string, unknown>,
    ];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  } else if (
    Object.values(typedAddressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries).some(
          (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      typedAddressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries).some(
        (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
      ),
    ) as [string, Record<string, Record<string, unknown>>];
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry as Record<string, unknown>,
        )}'`,
      ),
    );
    return state;
  } else if (!isObject(typedState.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof typedState.user}'`),
    );
    return state;
  }

  const localChainIds = Object.values(
    typedNetworkControllerState.networkConfigurations,
  ).reduce((customChainIds, networkConfiguration) => {
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

  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  for (const [networkId, addressEntries] of Object.entries(
    typedAddressBookControllerState.addressBook,
  )) {
    const ambiguousNetwork = (
      ambiguousNetworks as Record<string, { chainIds: string[] }>
    )[networkId];
    if (ambiguousNetwork) {
      const chainIdCandidates = ambiguousNetwork.chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries);
        }
        migratedAddressBook[chainId] = mapValues(addressEntries, (entry) => ({
          ...(entry as Record<string, unknown>),
          chainId,
        })) as Record<string, unknown>;
      }
    } else {
      migratedAddressBook[networkId] = addressEntries;
    }
  }

  typedAddressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (typedState.user as Record<string, unknown>).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return state;
}
