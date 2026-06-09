import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache, { type Server, type ServerOptions } from 'ganache';

export const DEFAULT_GANACHE_PORT = 8545;

/**
 * Options accepted by the Ganache server. Extends ganache's `ServerOptions`
 * with the legacy flat option keys that this wrapper relies on at runtime.
 */
type GanacheOptions = ServerOptions & {
  blockTime?: number;
  network_id?: number;
  port?: number;
  vmErrorsOnRPCResponse?: boolean;
  hardfork?: string;
  quiet?: boolean;
  mnemonic?: string;
};

const defaultOptions: GanacheOptions = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

export default class Ganache {
  private _server: Server | undefined;

  async start(opts: GanacheOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this._server = ganache.server(options);
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider() {
    return this._server?.provider;
  }

  async getAccounts(): Promise<string[]> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('Server not running yet');
    }
    return await provider.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance(): Promise<number | string> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('Server not running yet');
    }
    const accounts = await this.getAccounts();
    const balanceHex = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(String(balanceHex), 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit(): Promise<void> {
    if (!this._server) {
      throw new Error('Server not running yet');
    }
    await this._server.close();
    this._server = undefined;
  }
}
