import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { DEFAULT_GANACHE_PORT } from '../../app/util/test/ganache';
import { DEFAULT_FIXTURE_SERVER_PORT } from './fixture-server';
import { DEFAULT_DAPP_SERVER_PORT } from './fixture-helper';

export const DEFAULT_MOCKSERVER_PORT = 8000;

/**
 * Transforms a default port using the process ID to create a unique port number.
 * This is useful in CI environments to avoid port conflicts between parallel test runs.
 *
 * @param defaultPort - The default port number to transform
 * @param pid - The process ID to use for transformation
 * @returns A valid port number between 0 and 65535
 */
function transformToValidPort(defaultPort: number, pid: number): number {
  // Improve uniqueness by using a simple transformation
  const transformedPort = (pid % 100000) + defaultPort;

  // Ensure the transformed port falls within the valid port range (0-65535)
  return transformedPort % 65536;
}

/**
 * Gets a server port, using a transformed port in CI environments to avoid conflicts.
 *
 * @param defaultPort - The default port number to use
 * @returns The port number to use (transformed in CI, default otherwise)
 */
function getServerPort(defaultPort: number): number {
  if (process.env.CI) {
    return transformToValidPort(defaultPort, process.pid);
  }
  return defaultPort;
}

/**
 * Gets the Ganache server port.
 *
 * @returns The port number for the Ganache server
 */
export function getGanachePort(): number {
  return getServerPort(DEFAULT_GANACHE_PORT);
}

/**
 * Gets the fixtures server port.
 *
 * @returns The port number for the fixtures server
 */
export function getFixturesServerPort(): number {
  return getServerPort(DEFAULT_FIXTURE_SERVER_PORT);
}

/**
 * Gets the local test dapp port.
 *
 * @returns The port number for the local test dapp
 */
export function getLocalTestDappPort(): number {
  return getServerPort(DEFAULT_DAPP_SERVER_PORT);
}

/**
 * Gets the mock server port.
 *
 * @returns The port number for the mock server
 */
export function getMockServerPort(): number {
  return getServerPort(DEFAULT_MOCKSERVER_PORT);
}

/**
 * Represents the structure of optional scopes for chain permissions.
 */
interface OptionalScopes {
  [key: string]: {
    accounts: string[];
  };
}

/**
 * Represents the CAIP-25 caveat value structure.
 */
interface Caip25CaveatValue {
  optionalScopes: OptionalScopes;
  requiredScopes: Record<string, unknown>;
  sessionProperties: Record<string, unknown>;
  isMultichainOrigin: boolean;
}

/**
 * Represents a single caveat in the permission structure.
 */
interface Caveat {
  type: string;
  value: Caip25CaveatValue;
}

/**
 * Represents the permission structure for CAIP-25.
 */
interface Caip25Permission {
  caveats: Caveat[];
}

/**
 * Represents the permissions object returned by buildPermissions.
 */
interface Permissions {
  [key: string]: Caip25Permission;
}

/**
 * Builds a permissions object for the given chain IDs.
 * Creates a CAIP-25 compliant permission structure with optional scopes for each chain.
 *
 * @param chainIds - Array of chain IDs (as hex strings) to include in permissions
 * @returns A permissions object with CAIP-25 structure
 */
export function buildPermissions(chainIds: string[]): Permissions {
  // default mainnet
  const optionalScopes: OptionalScopes = { 'eip155:1': { accounts: [] } };

  for (const chainId of chainIds) {
    optionalScopes[`eip155:${parseInt(chainId, 16)}`] = {
      accounts: [],
    };
  }
  return {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            optionalScopes,
            requiredScopes: {},
            sessionProperties: {},
            isMultichainOrigin: false,
          },
        },
      ],
    },
  };
}
