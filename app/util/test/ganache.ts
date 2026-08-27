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

export default class Ganache {
// @ts-expect-error -- legacy JavaScript UI type boundary
  async start(opts) {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
// @ts-expect-error -- legacy JavaScript UI type boundary
      this._server = ganache.server(options);
// @ts-expect-error -- legacy JavaScript UI type boundary
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider() {
// @ts-expect-error -- legacy JavaScript UI type boundary
    return this._server?.provider;
  }

  async getAccounts() {
    return await this.getProvider().request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance() {
    const accounts = await this.getAccounts();
    const balanceHex = await this.getProvider().request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit() {
// @ts-expect-error -- legacy JavaScript UI type boundary
    if (!this._server) {
      throw new Error('Server not running yet');
    }
// @ts-expect-error -- legacy JavaScript UI type boundary
    await this._server.close();
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._server = undefined;
  }
}
