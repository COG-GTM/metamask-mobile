import { JsonRpcEngine } from '@metamask/json-rpc-engine';
import { createAsyncWalletMiddleware } from './createAsyncWalletMiddleware';
import { getPermittedAccounts } from '../Permissions';
import Engine from '../Engine';

const PERMITTED_ACCOUNT = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const SELECTED_ACCOUNT = '0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477';

jest.mock('../Permissions', () => ({
  getPermittedAccounts: jest.fn(),
}));

jest.mock('../Engine', () => ({
  context: {
    AccountsController: {
      getSelectedAccount: () => ({ address: SELECTED_ACCOUNT }),
    },
    TransactionController: {
      addTransactionBatch: jest.fn().mockResolvedValue({ batchId: '0x1' }),
      isAtomicBatchSupported: jest.fn().mockResolvedValue([true]),
    },
  },
  controllerMessenger: {
    call: jest.fn().mockReturnValue({ configuration: { chainId: '0xaa36a7' } }),
  },
}));

const mockGetPermittedAccounts = jest.mocked(getPermittedAccounts);

const sendCallsRequest = (from?: string) => ({
  id: 1,
  jsonrpc: '2.0' as const,
  method: 'wallet_sendCalls',
  origin: 'request-origin.test',
  networkClientId: 'sepolia',
  params: [
    {
      version: '2.0.0',
      ...(from ? { from } : {}),
      chainId: '0xaa36a7',
      atomicRequired: true,
      calls: [{ to: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb' }],
    },
  ],
});

const createEngine = (origin: string) => {
  const engine = new JsonRpcEngine();
  engine.push(createAsyncWalletMiddleware(origin));
  return engine;
};

describe('createAsyncWalletMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('return instance of Wallet Middleware', async () => {
    const middleware = createAsyncWalletMiddleware('metamask.github.io');
    expect(middleware).toBeDefined();
  });

  it.each(['metamask.github.io', 'sdk-channel-id', 'walletconnect.dapp'])(
    'authorizes wallet_sendCalls against the permitted accounts of origin %s',
    async (origin) => {
      mockGetPermittedAccounts.mockReturnValue([PERMITTED_ACCOUNT]);

      const response = await createEngine(origin).handle(
        sendCallsRequest() as never,
      );

      expect(mockGetPermittedAccounts).toHaveBeenCalledWith(origin);
      expect(mockGetPermittedAccounts).not.toHaveBeenCalledWith(
        'request-origin.test',
      );
      expect(
        Engine.context.TransactionController.addTransactionBatch,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          from: PERMITTED_ACCOUNT,
          origin: 'request-origin.test',
        }),
      );
      expect(response).toHaveProperty('result', { id: '0x1' });
    },
  );

  it('rejects wallet_sendCalls from an origin with no permitted accounts', async () => {
    mockGetPermittedAccounts.mockReturnValue([]);

    const response = await createEngine('unconnected.dapp').handle(
      sendCallsRequest() as never,
    );

    expect(response).toHaveProperty('error');
    expect(
      Engine.context.TransactionController.addTransactionBatch,
    ).not.toHaveBeenCalled();
  });

  it('rejects wallet_sendCalls for the selected account when it is not permitted', async () => {
    mockGetPermittedAccounts.mockReturnValue([PERMITTED_ACCOUNT]);

    const response = await createEngine('metamask.github.io').handle(
      sendCallsRequest(SELECTED_ACCOUNT) as never,
    );

    expect(response).toHaveProperty('error');
    expect(
      Engine.context.TransactionController.addTransactionBatch,
    ).not.toHaveBeenCalled();
  });
});
