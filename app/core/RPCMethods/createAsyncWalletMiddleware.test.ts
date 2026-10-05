import { createAsyncWalletMiddleware } from './createAsyncWalletMiddleware';

describe('createAsyncWalletMiddleware', () => {
  it('return instance of Wallet Middleware', async () => {
    const middleware = createAsyncWalletMiddleware('metamask.github.io');
    expect(middleware).toBeDefined();
  });
});
