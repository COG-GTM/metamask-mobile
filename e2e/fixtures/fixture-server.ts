/* eslint-disable no-console, import/no-nodejs-modules */
import { getFixturesServerPort } from './utils';
import Koa, { Context } from 'koa';
import type { Server } from 'http';
import { isObject, mapValues } from 'lodash';

const CURRENT_STATE_KEY = '__CURRENT__';
const DEFAULT_STATE_KEY = '__DEFAULT__';

const FIXTURE_SERVER_HOST = 'localhost';
export const DEFAULT_FIXTURE_SERVER_PORT = 12345;

const fixtureSubstitutionPrefix = '__FIXTURE_SUBSTITUTION__';
const CONTRACT_KEY = 'CONTRACT';
const fixtureSubstitutionCommands = {
  currentDateInMilliseconds: 'currentDateInMilliseconds',
} as const;

/**
 * Interface for the contract registry used in state substitutions.
 */
interface ContractRegistry {
  getContractAddress(contract: string): string;
}

/**
 * Represents the raw state object that can be loaded into the fixture server.
 */
type RawState = Record<string, unknown>;

/**
 * Perform substitutions on a single piece of state.
 *
 * @param partialState - The piece of state to perform substitutions on.
 * @param contractRegistry - The smart contract registry.
 * @returns The partial state with substitutions performed.
 */
function performSubstitution(
  partialState: unknown,
  contractRegistry?: ContractRegistry,
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
    );
    if (
      substitutionCommand ===
      fixtureSubstitutionCommands.currentDateInMilliseconds
    ) {
      return new Date().getTime();
    } else if (partialState.includes(CONTRACT_KEY)) {
      const contract = partialState.split(CONTRACT_KEY).pop();
      if (contract && contractRegistry) {
        return contractRegistry.getContractAddress(contract);
      }
      throw new Error(`Contract registry not provided for substitution`);
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
  rawState: RawState,
  contractRegistry?: ContractRegistry,
): RawState {
  return mapValues(rawState, (item) =>
    performSubstitution(item, contractRegistry),
  ) as RawState;
}

/**
 * A server that serves fixture state for E2E tests.
 * Provides a simple HTTP endpoint to retrieve the current test state.
 */
class FixtureServer {
  private _app: Koa;
  private _stateMap: Map<string, RawState>;
  private _server: Server | undefined;

  constructor() {
    this._app = new Koa();
    this._stateMap = new Map([[DEFAULT_STATE_KEY, Object.create(null)]]);

    this._app.use(async (ctx: Context) => {
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

  /**
   * Start the fixture server.
   *
   * @returns A promise that resolves when the server is listening.
   */
  async start(): Promise<void> {
    const options = {
      host: FIXTURE_SERVER_HOST,
      port: getFixturesServerPort(),
      exclusive: true,
    };

    return new Promise((resolve, reject) => {
      console.log('Starting fixture server...');
      const server = this._app.listen(options);
      this._server = server;
      server.once('error', reject);
      server.once('listening', resolve);
    });
  }

  /**
   * Stop the fixture server.
   *
   * @returns A promise that resolves when the server is closed.
   */
  async stop(): Promise<void> {
    if (!this._server) {
      return;
    }

    const server = this._server;
    await new Promise<void>((resolve, reject) => {
      console.log('Stopping fixture server...');
      server.close();
      server.once('error', reject);
      server.once('close', resolve);
      this._server = undefined;
    });
  }

  /**
   * Load JSON state into the server.
   *
   * @param rawState - The raw state to load.
   * @param contractRegistry - Optional contract registry for substitutions.
   */
  loadJsonState(rawState: RawState, contractRegistry?: ContractRegistry): void {
    console.log('Loading JSON state...');
    const state = performStateSubstitutions(rawState, contractRegistry);
    this._stateMap.set(CURRENT_STATE_KEY, state);
    console.log('JSON state loaded');
  }

  /**
   * Check if the request is for the current state.
   *
   * @param ctx - The Koa context.
   * @returns True if the request is for the state endpoint.
   */
  private _isStateRequest(ctx: Context): boolean {
    return ctx.method === 'GET' && ctx.path === '/state.json';
  }
}

export default FixtureServer;
