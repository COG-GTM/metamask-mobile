/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error koa has no types in this lockfile
import Koa from 'koa';
import { isObject, mapValues } from 'lodash';
import { getFixturesServerPort } from './utils';

const CURRENT_STATE_KEY = '__CURRENT__';
const DEFAULT_STATE_KEY = '__DEFAULT__';

const FIXTURE_SERVER_HOST = 'localhost';
export const DEFAULT_FIXTURE_SERVER_PORT = 12345;

const fixtureSubstitutionPrefix = '__FIXTURE_SUBSTITUTION__';
const CONTRACT_KEY = 'CONTRACT';
const fixtureSubstitutionCommands = {
  currentDateInMilliseconds: 'currentDateInMilliseconds',
};

interface ContractRegistry {
  getContractAddress: (contract: string) => string;
}

/**
 * Perform substitutions on a single piece of state.
 */
function performSubstitution(
  partialState: unknown,
  contractRegistry: ContractRegistry | undefined,
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
      if (!contractRegistry || !contract) {
        throw new Error(
          'Contract registry not provided for contract substitution',
        );
      }
      return contractRegistry.getContractAddress(contract);
    }
    throw new Error(`Unknown substitution command: ${substitutionCommand}`);
  }
  return partialState;
}

/**
 * Substitute values in the state fixture.
 */
function performStateSubstitutions(
  rawState: Record<string, unknown>,
  contractRegistry: ContractRegistry | undefined,
) {
  return mapValues(rawState, (item) =>
    performSubstitution(item, contractRegistry),
  );
}

class FixtureServer {
  _app: any;
  _stateMap: Map<string, unknown>;
  _server: any;

  constructor() {
    this._app = new Koa();
    this._stateMap = new Map<string, unknown>([
      [DEFAULT_STATE_KEY, Object.create(null)],
    ]);

    this._app.use(async (ctx: any) => {
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
  async start() {
    const options = {
      host: FIXTURE_SERVER_HOST,
      port: getFixturesServerPort(),
      exclusive: true,
    };

    return new Promise<void>((resolve, reject) => {
      console.log('Starting fixture server...');
      this._server = this._app.listen(options);
      this._server.once('error', reject);
      this._server.once('listening', resolve);
    });
  }
  // Stop the fixture server
  async stop() {
    if (!this._server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      console.log('Stopping fixture server...');
      this._server.close();
      this._server.once('error', reject);
      this._server.once('close', resolve);
      this._server = undefined;
    });
  }
  // Load JSON state into the server
  loadJsonState(
    rawState: Record<string, unknown>,
    contractRegistry: ContractRegistry | undefined,
  ) {
    console.log('Loading JSON state...');
    const state = performStateSubstitutions(rawState, contractRegistry);
    this._stateMap.set(CURRENT_STATE_KEY, state);
    console.log('JSON state loaded');
  }
  // Check if the request is for the current state
  _isStateRequest(ctx: { method: string; path: string }) {
    return ctx.method === 'GET' && ctx.path === '/state.json';
  }
}

export default FixtureServer;
