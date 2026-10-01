import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache, {
  EthereumProvider,
  Server,
  ServerOptions,
} from 'ganache';

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
  #server: Server | undefined;

  async start(opts: ServerOptions & { mnemonic?: string }): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this.#server = ganache.server(options);
      await this.#server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider(): EthereumProvider | undefined {
    return this.#server?.provider;
  }

  #getRunningProvider(): EthereumProvider {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('Server not running yet');
    }
    return provider;
  }

  async getAccounts(): Promise<string[]> {
    return await this.#getRunningProvider().request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance(): Promise<number | string> {
    const accounts = await this.getAccounts();
    const balanceHex = await this.#getRunningProvider().request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit(): Promise<void> {
    if (!this.#server) {
      throw new Error('Server not running yet');
    }
    await this.#server.close();
    this.#server = undefined;
  }
}
