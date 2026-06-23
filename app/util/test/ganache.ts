import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache, { EthereumProvider, Server, ServerOptions } from 'ganache';

export const DEFAULT_GANACHE_PORT = 8545;

/**
 * Supported Ethereum hardfork identifiers for Ganache.
 */
type Hardfork =
  | 'constantinople'
  | 'byzantium'
  | 'petersburg'
  | 'istanbul'
  | 'muirGlacier'
  | 'berlin'
  | 'london'
  | 'arrowGlacier'
  | 'grayGlacier'
  | 'merge'
  | 'shanghai';

/**
 * Options accepted by Ganache.start(). Uses ganache's legacy flat-key format.
 */
interface GanacheOptions {
  /** Mnemonic phrase for generating HD wallet accounts. */
  mnemonic: string;
  /** Block time in seconds for automatic mining. 0 = instamine. */
  blockTime?: number;
  /** Network ID returned by net_version RPC method. */
  network_id?: number;
  /** Port number for the server to listen on. */
  port?: number;
  /** Whether to report runtime EVM errors as RPC errors. */
  vmErrorsOnRPCResponse?: boolean;
  /** Ethereum hardfork to use. */
  hardfork?: Hardfork;
  /** Suppress logging output. */
  quiet?: boolean;
}

const defaultOptions: Omit<GanacheOptions, 'mnemonic'> = {
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
      this._server = ganache.server(
        options as unknown as ServerOptions,
      );
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider(): EthereumProvider {
    if (!this._server) {
      throw new Error('Server not started yet');
    }
    return this._server.provider;
  }

  async getAccounts(): Promise<string[]> {
    const provider = this.getProvider();
    return await provider.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance(): Promise<string | number> {
    const accounts = await this.getAccounts();
    const balanceHex = await this.getProvider().request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted: string | number =
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
