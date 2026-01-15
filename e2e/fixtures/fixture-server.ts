/* eslint-disable no-console, import/no-nodejs-modules */
import { getFixturesServerPort } from './utils';
// @ts-expect-error - koa has no type definitions installed
import Koa from 'koa';
import { isObject, mapValues } from 'lodash';
import type { Server } from 'http';
import type ContractAddressRegistry from '../../app/util/test/contract-address-registry';

const CURRENT_STATE_KEY = '__CURRENT__';
const DEFAULT_STATE_KEY = '__DEFAULT__';

const FIXTURE_SERVER_HOST = 'localhost';
export const DEFAULT_FIXTURE_SERVER_PORT = 12345;

const fixtureSubstitutionPrefix = '__FIXTURE_SUBSTITUTION__';
const CONTRACT_KEY = 'CONTRACT';
const fixtureSubstitutionCommands = {
  currentDateInMilliseconds: 'currentDateInMilliseconds',
} as const;

type FixtureSubstitutionCommand =
  (typeof fixtureSubstitutionCommands)[keyof typeof fixtureSubstitutionCommands];

interface FixtureState {
  [key: string]: unknown;
}

// Local Context interface for Koa middleware (since @types/koa is not installed)
interface KoaContext {
  method: string;
  path: string;
  body: unknown;
  set(field: string, value: string): void;
}

/**
 * Perform substitutions on a single piece of state.
 *
 * @param partialState - The piece of state to perform substitutions on.
 * @param contractRegistry - The smart contract registry.
 * @returns The partial state with substitutions performed.
 */
function performSubstitution(
  partialState: unknown,
  contractRegistry?: ContractAddressRegistry,
): unknown {
  if (Array.isArray(partialState)) {
    return partialState.map((item) =>
      performSubstitution(item, contractRegistry),
    );
  } else if (isObject(partialState)) {
    return mapValues(partialState as Record<string, unknown>, (item) =>
      performSubstitution(item, contractRegistry),
    );
  } else if (
    typeof partialState === 'string' &&
    partialState.startsWith(fixtureSubstitutionPrefix)
  ) {
    const substitutionCommand = partialState.substring(
      fixtureSubstitutionPrefix.length,
    ) as FixtureSubstitutionCommand;
    if (
      substitutionCommand ===
      fixtureSubstitutionCommands.currentDateInMilliseconds
    ) {
      return new Date().getTime();
    } else if (partialState.includes(CONTRACT_KEY)) {
      const contract = partialState.split(CONTRACT_KEY).pop();
      return contractRegistry?.getContractAddress(contract ?? '');
    }
    throw new Error(`Unknown substitution command: ${substitutionCommand}`);
  }
  return partialState;
}

/**
 * Substitute values in the state fixture.
 *
 * @param rawState - The state fixture.
 * @param contractRegistry - The smart contract registry.
 * @returns The state fixture with substitutions performed.
 */
function performStateSubstitutions(
  rawState: FixtureState,
  contractRegistry?: ContractAddressRegistry,
): FixtureState {
  return mapValues(rawState, (item) =>
    performSubstitution(item, contractRegistry),
  );
}

class FixtureServer {
  private _app: Koa;
  private _server: Server | undefined;
  private _stateMap: Map<string, FixtureState>;

  constructor() {
    this._app = new Koa();
    this._stateMap = new Map([[DEFAULT_STATE_KEY, Object.create(null)]]);

    this._app.use(async (ctx: KoaContext) => {
      // Middleware to handle requests
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      ctx.set(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      // Check if it's a request for the current state
      if (this._isStateRequest(ctx)) {
        ctx.body = this._stateMap.get(CURRENT_STATE_KEY);
      }
    });
  }

  // Start the fixture server
  async start(): Promise<void> {
    const options = {
      host: FIXTURE_SERVER_HOST,
      port: getFixturesServerPort(),
      exclusive: true,
    };

    return new Promise<void>((resolve, reject) => {
      console.log('Starting fixture server...');
      this._server = this._app.listen(options);
      this._server!.once('error', reject);
      this._server!.once('listening', resolve);
    });
  }

  // Stop the fixture server
  async stop(): Promise<void> {
    if (!this._server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      console.log('Stopping fixture server...');
      this._server?.close();
      this._server?.once('error', reject);
      this._server?.once('close', resolve);
      this._server = undefined;
    });
  }

  // Load JSON state into the server
  loadJsonState(
    rawState: FixtureState,
    contractRegistry?: ContractAddressRegistry,
  ): void {
    console.log('Loading JSON state...');
    const state = performStateSubstitutions(rawState, contractRegistry);
    this._stateMap.set(CURRENT_STATE_KEY, state);
    console.log('JSON state loaded');
  }

  // Check if the request is for the current state
  private _isStateRequest(ctx: KoaContext): boolean {
    return ctx.method === 'GET' && ctx.path === '/state.json';
  }
}

export default FixtureServer;
