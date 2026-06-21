import ganache, { EthereumProvider, Server, ServerOptions } from 'ganache';
import { getGanachePort } from '../../../e2e/fixtures/utils';

export const DEFAULT_GANACHE_PORT = 8545;

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

interface GanacheStartOptions {
  mnemonic: string;
  [key: string]: unknown;
}

export default class Ganache {
  private _server: Server | undefined;

  async start(opts: GanacheStartOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this._server = ganache.server(options as unknown as ServerOptions);
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider(): EthereumProvider | undefined {
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
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

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
