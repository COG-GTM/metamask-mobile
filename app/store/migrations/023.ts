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
export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const keyringControllerState = s.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = s.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    s.engine.backgroundState.AddressBookController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return s;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return s;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration: any) => !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]: [string, any]) =>
        !hasProperty(networkConfiguration, 'chainId'),
    ) as [string, Record<string, any>];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration,
        )}'`,
      ),
    );
    return s;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return s;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return s;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries)) as [string, unknown];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return s;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries as Record<string, any>).some(
          (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries as Record<string, any>).some(
        (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
      ),
    ) as [string, Record<string, any>];
    const invalidEntry = Object.values(invalidEntries).find(
      (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry as Record<string, any>,
        )}'`,
      ),
    );
    return s;
  } else if (!isObject(s.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof s.user}'`),
    );
    return s;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce((customChainIds: Set<string>, networkConfiguration: any) => {
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

  const migratedAddressBook = {};
  const ambiguousAddressEntries = {};
  const ambiguousNetworksMap = ambiguousNetworks as Record<string, { chainIds: string[] }>;
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if (ambiguousNetworksMap[networkId]) {
      const chainIdCandidates = ambiguousNetworksMap[networkId].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId: string) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          (ambiguousAddressEntries as Record<string, any>)[chainId] = Object.keys(addressEntries as Record<string, any>);
        }
        (migratedAddressBook as Record<string, any>)[chainId] = mapValues(addressEntries as Record<string, any>, (entry: any) => ({
          ...entry,
          chainId,
        }));
      }
    } else {
      (migratedAddressBook as Record<string, any>)[networkId] = addressEntries;
    }
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    s.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return s;
}
