import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

export default function migrate(state: unknown): unknown {
  const s = state as Record<string, unknown>;
  const engineState = s.engine as Record<string, unknown>;
  const backgroundState = engineState?.backgroundState as Record<
    string,
    unknown
  >;

  const keyringControllerState = backgroundState?.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = backgroundState?.NetworkController;
  const addressBookControllerState = backgroundState?.AddressBookController;

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
    const result = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !isObject(networkConfiguration) ||
        !hasProperty(networkConfiguration, 'chainId'),
    );
    const invalidConfigurationId = result?.[0];
    const invalidConfiguration = result?.[1] as Record<string, unknown>;
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration ?? {},
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
    const result = Object.entries(
      addressBookControllerState.addressBook,
    ).find(
      ([_networkId, addressEntries]) => !isObject(addressEntries),
    );
    const networkId = result?.[0];
    const invalidEntries = result?.[1];
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
    const result = Object.entries(
      addressBookControllerState.addressBook,
    ).find(
      ([_networkId, addressEntries]) =>
        isObject(addressEntries) &&
        Object.values(addressEntries).some(
          (addressEntry) =>
            !isObject(addressEntry) || !hasProperty(addressEntry, 'chainId'),
        ),
    );
    const networkId = result?.[0];
    const invalidEntries = result?.[1] as Record<
      string,
      Record<string, unknown>
    >;
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
  } else if (!isObject(s.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof s.user}'`),
    );
    return state;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce((customChainIds: Set<unknown>, networkConfiguration) => {
    if (isObject(networkConfiguration)) {
      customChainIds.add(networkConfiguration.chainId);
    }
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

  const migratedAddressBook: Record<string, unknown> = {};
  const ambiguousAddressEntries: Record<string, string[]> = {};
  const ambiguousNetworksTyped = ambiguousNetworks as Record<
    string,
    { chainIds: string[] }
  >;
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
          addressEntries as Record<string, unknown>,
          (entry) => ({
            ...(entry as Record<string, unknown>),
            chainId,
          }),
        );
      }
    } else {
      migratedAddressBook[networkId] = addressEntries;
    }
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (s.user as Record<string, unknown>).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return state;
}
