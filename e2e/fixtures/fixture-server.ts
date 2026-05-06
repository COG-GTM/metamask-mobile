/* eslint-disable no-console */
import { getFixturesServerPort } from './utils';
// `koa` does not ship TypeScript declarations in this project, so import via require.
// eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
const Koa = require('koa') as new () => KoaApp;
import type { Server } from 'http';
import { isObject, mapValues } from 'lodash';

interface KoaContext {
  method: string;
  path: string;
  body: unknown;
  set(field: string, value: string): void;
}

interface KoaApp {
  use(handler: (ctx: KoaContext) => Promise<void> | void): KoaApp;
  listen(options: { host: string; port: number; exclusive: boolean }): Server;
}

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
  getContractAddress(contract: string | undefined): string;
}

/**
 * Perform substitutions on a single piece of state.
 */
function performSubstitution(
  partialState: unknown,
  contractRegistry: ContractRegistry,
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
  contractRegistry: ContractRegistry,
): Record<string, unknown> {
  return mapValues(rawState, (item) =>
    performSubstitution(item, contractRegistry),
  );
}

class FixtureServer {
  private _app: KoaApp;
  private _stateMap: Map<string, unknown>;
  private _server: Server | undefined;

  constructor() {
    this._app = new Koa();
    this._stateMap = new Map<string, unknown>([
      [DEFAULT_STATE_KEY, Object.create(null)],
    ]);

    this._app.use(async (ctx) => {
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
      const server = this._app.listen(options);
      this._server = server;
      server.once('error', reject);
      server.once('listening', () => resolve());
    });
  }

  // Stop the fixture server
  async stop(): Promise<void> {
    const server = this._server;
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      console.log('Stopping fixture server...');
      server.close();
      server.once('error', reject);
      server.once('close', () => resolve());
      this._server = undefined;
    });
  }

  // Load JSON state into the server
  loadJsonState(
    rawState: Record<string, unknown>,
    contractRegistry: ContractRegistry,
  ): void {
    console.log('Loading JSON state...');
    const state = performStateSubstitutions(rawState, contractRegistry);
    this._stateMap.set(CURRENT_STATE_KEY, state);
    console.log('JSON state loaded');
  }

  // Check if the request is for the current state
  _isStateRequest(ctx: KoaContext): boolean {
    return ctx.method === 'GET' && ctx.path === '/state.json';
  }
}

export default FixtureServer;
