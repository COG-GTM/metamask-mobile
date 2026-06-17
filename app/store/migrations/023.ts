import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

interface MigrationState {
  engine: {
    backgroundState: {
      KeyringController?: unknown;
      NetworkController?: unknown;
      AddressBookController?: unknown;
      [key: string]: unknown;
    };
  };
  user?: unknown;
  [key: string]: unknown;
}

type AmbiguousNetworks = Record<string, { chainIds: string[] }>;

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
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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
    return typedState as unknown as Record<string, unknown>;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration) =>
        !hasProperty(networkConfiguration as object, 'chainId'),
    )
  ) {
    const [invalidConfigurationId, invalidConfiguration] =
      Object.entries(networkControllerState.networkConfigurations).find(
        ([_networkConfigId, networkConfiguration]) =>
          !hasProperty(networkConfiguration as object, 'chainId'),
      ) ?? [];
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration as object,
        )}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const [networkId, invalidEntries] =
      Object.entries(addressBookControllerState.addressBook).find(
        ([_networkId, addressEntries]) => !isObject(addressEntries),
      ) ?? [];
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries as object).some(
          (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
        ),
    )
  ) {
    const [networkId, invalidEntries] =
      Object.entries(addressBookControllerState.addressBook).find(
        ([_networkId, addressEntries]) =>
          Object.values(addressEntries as object).some(
            (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
          ),
      ) ?? [];
    const invalidEntry = Object.values(invalidEntries as object).find(
      (addressEntry) => !hasProperty(addressEntry as object, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry as object,
        )}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (!isObject(typedState.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof typedState.user}'`),
    );
    return typedState as unknown as Record<string, unknown>;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce<Set<unknown>>((customChainIds, networkConfiguration) => {
    customChainIds.add((networkConfiguration as { chainId: unknown }).chainId);
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
  const ambiguousAddressEntries: Record<string, unknown> = {};
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if ((ambiguousNetworks as AmbiguousNetworks)[networkId]) {
      const chainIdCandidates = (ambiguousNetworks as AmbiguousNetworks)[
        networkId
      ].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(
            addressEntries as object,
          );
        }
        migratedAddressBook[chainId] = mapValues(
          addressEntries as Record<string, unknown>,
          (entry) => ({
            ...(entry as object),
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
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    (typedState.user as Record<string, unknown>).ambiguousAddressEntries =
      ambiguousAddressEntries;
  }

  return typedState as unknown as Record<string, unknown>;
}
