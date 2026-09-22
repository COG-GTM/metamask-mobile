import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache from 'ganache';

export const DEFAULT_GANACHE_PORT = 8545;

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

type GanacheServer = ReturnType<typeof ganache.server>;
type GanacheServerOptions = Parameters<typeof ganache.server>[0];
type GanacheProvider = GanacheServer['provider'];

export interface GanacheOptions {
  mnemonic?: string;
  [option: string]: unknown;
}

export default class Ganache {
  private _server?: GanacheServer;

  async start(opts: GanacheOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this._server = ganache.server(
        options as unknown as GanacheServerOptions,
      );
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider(): GanacheProvider | undefined {
    return this._server?.provider;
  }

  async getAccounts(): Promise<string[]> {
    return await this.getProvider()?.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance(): Promise<number | string> {
    const accounts = await this.getAccounts();
    const balanceHex = await this.getProvider()?.request({
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
