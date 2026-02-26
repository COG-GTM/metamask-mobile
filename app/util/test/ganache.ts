import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache, { Server, ServerOptions, EthereumProvider } from 'ganache';

export const DEFAULT_GANACHE_PORT = 8545;

interface GanacheStartOptions {
  mnemonic: string;
  blockTime?: number;
  network_id?: number;
  port?: number;
  vmErrorsOnRPCResponse?: boolean;
  hardfork?: string;
  quiet?: boolean;
}

const defaultOptions: Omit<GanacheStartOptions, 'mnemonic'> = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

export default class Ganache {
  private _server: Server | undefined;

  async start(opts: GanacheStartOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this._server = ganache.server(options as ServerOptions);
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
    return (await provider.request({
      method: 'eth_accounts',
      params: [],
    })) as string[];
  }

  async getBalance(): Promise<string | number> {
    const accounts = await this.getAccounts();
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('Server not running yet');
    }
    const balanceHex = (await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })) as string;
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
