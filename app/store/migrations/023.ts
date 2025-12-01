import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ambiguousNetworks: Record<string, any> = require('./migration-data/amibiguous-networks.json');

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
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
  } else if (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(networkControllerState.networkConfigurations as Record<string, any>).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (networkConfiguration: any) => !hasProperty(networkConfiguration, 'chainId'),
    )
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invalidConfigurationId, invalidConfiguration] = Object.entries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      networkControllerState.networkConfigurations as Record<string, any>,
    ).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([_networkConfigId, networkConfiguration]: [string, any]) =>
        !hasProperty(networkConfiguration, 'chainId'),
    ) as [string, any];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(addressBookControllerState.addressBook as Record<string, any>).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (addressEntries: any) => !isObject(addressEntries),
    )
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [networkId, invalidEntries] = Object.entries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addressBookControllerState.addressBook as Record<string, any>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).find(([_networkId, addressEntries]: [string, any]) => !isObject(addressEntries)) as [string, any];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  } else if (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(addressBookControllerState.addressBook as Record<string, any>).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (addressEntries: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(addressEntries as Record<string, any>).some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
        ),
    )
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [networkId, invalidEntries] = Object.entries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addressBookControllerState.addressBook as Record<string, any>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).find(([_networkId, addressEntries]: [string, any]) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(addressEntries as Record<string, any>).some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as [string, any];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidEntry = Object.values(invalidEntries as Record<string, any>).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (addressEntry: any) => !hasProperty(addressEntry, 'chainId'),
    );
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localChainIds = Object.values(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networkControllerState.networkConfigurations as Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migratedAddressBook: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ambiguousAddressEntries: Record<string, any> = {};
  for (const [networkId, addressEntries] of Object.entries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addressBookControllerState.addressBook as Record<string, any>,
  )) {
    if (ambiguousNetworks[networkId]) {
      const chainIdCandidates = ambiguousNetworks[networkId].chainIds;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId: any) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries as Record<string, any>);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        migratedAddressBook[chainId] = mapValues(addressEntries as Record<string, any>, (entry: any) => ({
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
    state.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
