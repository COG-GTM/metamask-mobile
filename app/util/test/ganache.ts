import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache, { type Server, type ServerOptions } from 'ganache';

type GanacheOptions = ServerOptions & { mnemonic?: string };
type GanacheServer = Server;
type GanacheProvider = GanacheServer['provider'];

export const DEFAULT_GANACHE_PORT = 8545;

const defaultOptions = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

export default class Ganache {
  private _server?: GanacheServer;

  async start(opts: GanacheOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = {
      ...defaultOptions,
      ...opts,
      port: getGanachePort(),
    } as ServerOptions & { port: number };
    const { port } = options;
    try {
      this._server = ganache.server(options as ServerOptions);
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
    const provider = this.getProvider() as GanacheProvider;
    return (await provider.request({
      method: 'eth_accounts',
      params: [],
    })) as string[];
  }

  async getBalance(): Promise<number | string> {
    const accounts = await this.getAccounts();
    const provider = this.getProvider() as GanacheProvider;
    const balanceHex = (await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })) as string;
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit() {
    if (!this._server) {
      throw new Error('Server not running yet');
    }
    await this._server.close();
    this._server = undefined;
  }
}
