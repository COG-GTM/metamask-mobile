import RNWalletConnect from '@walletconnect/client';
import Engine from '../Engine';
import { ApprovalTypes } from '../../core/RPCMethods/RPCMethodMiddleware';
import { flushPromises } from '../../util/test/utils';

const mockDappHost = 'metamask.io';
const mockDappUrl = `https://${mockDappHost}`;
const mockAutoSign = false;
const mockRedirectUrl = `${mockDappUrl}/redirect`;
const mockDappOrigin = 'origin';
const mockRandomId = '139404b0-1dd2-11b2-b040-cb962b38df0e';
const mockSessionRequest = {
  params: [
    {
      peerMeta: {
        url: mockDappUrl,
      },
    },
  ],
};
jest.mock('@walletconnect/client');
jest.mock('../Engine', () => ({
  context: {
    KeyringController: {
      isUnlocked: jest.fn().mockReturnValueOnce(true),
    },
    ApprovalController: {
      add: jest.fn(),
    },
    AccountsController: {
      getSelectedAccount: jest.fn(),
    },
    NetworkController: {
      findNetworkClientIdByChainId: jest.fn(),
    },
    PermissionController: {
      state: {},
    },
  },
}));
jest.mock('../BackgroundBridge/BackgroundBridge', () =>
  jest.fn().mockImplementation(({ url }) => ({
    hostname: new URL(url).hostname,
    onMessage: jest.fn(),
    onDisconnect: jest.fn(),
  })),
);
jest.mock('../../util/transaction-controller', () => ({
  addTransaction: jest.fn(),
}));
jest.mock('../../lib/ppom/ppom-util', () => ({
  validateRequest: jest.fn(),
}));
jest.mock('../Permissions', () => ({
  ...jest.requireActual('../Permissions'),
  getPermittedAccounts: jest.fn(() => []),
}));
const MockEngine = jest.mocked(Engine);
jest.mock('uuid', () => ({
  v1: jest.fn(() => mockRandomId),
}));

describe('WalletConnect', () => {
  const walletConnectorSessionRequestCallbackMock = jest
    .fn()
    .mockImplementationOnce((_, callback) => {
      callback(null, mockSessionRequest);
    });
  const walletConnectorRejectSessionMock = jest.fn();

  jest
    .spyOn(RNWalletConnect.prototype, 'on')
    .mockImplementation(walletConnectorSessionRequestCallbackMock);
  jest
    .spyOn(RNWalletConnect.prototype, 'rejectSession')
    .mockImplementation(walletConnectorRejectSessionMock);

  afterEach(() => {
    // Reset WalletConnect
    jest.resetModules();
  });

  it('should add new approval when new wallet connect session requested', async () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    const expectedApprovalRequest = {
      id: mockRandomId,
      origin: mockDappHost,
      requestData: {
        autosign: mockAutoSign,
        peerMeta: {
          url: mockDappUrl,
        },
        redirectUrl: mockRedirectUrl,
        requestOriginatedFrom: mockDappOrigin,
      },
      type: ApprovalTypes.WALLET_CONNECT,
    };

    const spyApprovalControllerAdd = jest.spyOn(
      Engine.context.ApprovalController,
      'add',
    );

    // Initialize WalletConnect
    await WalletConnect.init();

    // WalletConnect.newSession will reproduce the same behavior as the DeeplinkHandler
    // See app/core/DeeplinkManager.js, then walletConnectorSessionRequestCallbackMock will be picked up immediately
    await WalletConnect.newSession(
      'URI',
      mockRedirectUrl,
      mockAutoSign,
      'origin',
    );

    await flushPromises();

    expect(spyApprovalControllerAdd).toHaveBeenCalled();
    expect(spyApprovalControllerAdd).toHaveBeenCalledWith(
      expectedApprovalRequest,
    );
  });
  it('should call rejectSession when user rejects wallet connect session', async () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    MockEngine.context.ApprovalController.add.mockRejectedValueOnce(
      new Error('Test error'),
    );

    await WalletConnect.init();
    await WalletConnect.newSession(
      'URI',
      mockRedirectUrl,
      mockAutoSign,
      'origin',
    );

    await flushPromises();

    expect(walletConnectorRejectSessionMock).toHaveBeenCalled();
  });
});

describe('WalletConnect v1 eth_sendTransaction', () => {
  const sessionAccount = '0x0000000000000000000000000000000000000001';
  const otherWalletAccount = '0x0000000000000000000000000000000000000002';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setup = async () => {
    jest.resetModules();
    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
    const RNWC = require('@walletconnect/client').default;
    const EngineMock = require('../Engine');
    const StorageWrapper = require('../../store/storage-wrapper');
    const AppConstants = require('../AppConstants').default;
    const { addTransaction } = require('../../util/transaction-controller');
    const BackgroundBridgeModule = require('../BackgroundBridge/BackgroundBridge');
    const { store } = require('../../store');
    const { selectEvmChainId } = require('../../selectors/networkController');
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

    const handlers: Record<string, (...args: unknown[]) => Promise<void>> = {};
    let connector: Record<string, unknown> = {};
    jest
      .spyOn(RNWC.prototype, 'on')
      .mockImplementation(function (
        this: Record<string, unknown>,
        event: unknown,
        callback: unknown,
      ) {
        handlers[event as string] = callback as (
          ...args: unknown[]
        ) => Promise<void>;
        // eslint-disable-next-line @typescript-eslint/no-this-alias, consistent-this
        connector = this;
      });
    const rejectRequest = jest.spyOn(RNWC.prototype, 'rejectRequest');
    const approveRequest = jest.spyOn(RNWC.prototype, 'approveRequest');

    EngineMock.context.KeyringController.isUnlocked.mockReturnValue(true);
    EngineMock.context.AccountsController.getSelectedAccount.mockReturnValue({
      address: sessionAccount,
    });
    addTransaction.mockResolvedValue({
      transactionMeta: { id: 'tx-id' },
      result: Promise.resolve('0xhash'),
    });

    jest.spyOn(StorageWrapper, 'getItem').mockResolvedValue(
      JSON.stringify([
        {
          peerMeta: { url: mockDappUrl },
          requestOriginatedFrom: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
        },
      ]),
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const WalletConnect = require('./WalletConnect').default;
    await WalletConnect.init();
    await flushPromises();

    Object.defineProperty(connector, 'session', {
      configurable: true,
      value: { peerMeta: { url: mockDappUrl } },
    });

    const sendTransaction = async (params: Record<string, unknown>) => {
      await handlers.call_request(null, {
        id: Math.floor(Math.random() * 1e9),
        method: 'eth_sendTransaction',
        params: [params],
      });
      await flushPromises();
    };

    const BackgroundBridgeMock =
      BackgroundBridgeModule.default ?? BackgroundBridgeModule;
    const { updateSession } =
      BackgroundBridgeMock.mock.calls[
        BackgroundBridgeMock.mock.calls.length - 1
      ][0].wcRequestActions;

    return {
      sendTransaction,
      updateSession,
      activeChainId: selectEvmChainId(store.getState()),
      findNetworkClientIdByChainId:
        EngineMock.context.NetworkController.findNetworkClientIdByChainId,
      addTransaction,
      rejectRequest,
      approveRequest,
      connector,
    };
  };

  it('rejects a transaction from a wallet account not exposed to the session', async () => {
    const { sendTransaction, addTransaction, rejectRequest, approveRequest } =
      await setup();

    await sendTransaction({ from: otherWalletAccount, to: sessionAccount });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(approveRequest).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledTimes(1);
    expect(rejectRequest.mock.calls[0][0]).toMatchObject({
      error: expect.objectContaining({
        message:
          'Invalid parameters: must provide a permitted Ethereum address.',
      }),
    });
  });

  it('rejects a transaction without a from address', async () => {
    const { sendTransaction, addTransaction, rejectRequest } = await setup();

    await sendTransaction({ to: sessionAccount });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledTimes(1);
  });

  it('ignores accounts injected by a peer session update', async () => {
    const { sendTransaction, addTransaction, rejectRequest, connector } =
      await setup();

    // A malicious dapp can overwrite the connector's accounts via wc_sessionUpdate.
    Object.defineProperty(connector, 'accounts', {
      configurable: true,
      value: [otherWalletAccount],
    });
    await sendTransaction({ from: otherWalletAccount, to: sessionAccount });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects a previously exposed account after the session accounts are cleared', async () => {
    const { sendTransaction, updateSession, addTransaction, rejectRequest } =
      await setup();

    updateSession({ chainId: 1, accounts: [] });
    await sendTransaction({ from: sessionAccount, to: otherWalletAccount });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledTimes(1);
  });

  it('authorizes the account exposed by the latest wallet session update', async () => {
    const { sendTransaction, updateSession, addTransaction, rejectRequest } =
      await setup();

    updateSession({ chainId: 1, accounts: [otherWalletAccount] });
    await sendTransaction({ from: sessionAccount, to: otherWalletAccount });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledTimes(1);

    await sendTransaction({ from: otherWalletAccount, to: sessionAccount });

    expect(addTransaction).toHaveBeenCalledTimes(1);
  });

  it('uses the active chain when the request omits chainId', async () => {
    const {
      sendTransaction,
      addTransaction,
      rejectRequest,
      activeChainId,
      findNetworkClientIdByChainId,
    } = await setup();
    findNetworkClientIdByChainId.mockClear();

    await sendTransaction({ from: sessionAccount, to: otherWalletAccount });

    expect(rejectRequest).not.toHaveBeenCalled();
    expect(activeChainId).toBeDefined();
    expect(findNetworkClientIdByChainId).toHaveBeenCalledWith(activeChainId);
    expect(addTransaction).toHaveBeenCalledTimes(1);
  });

  it('adds the transaction when from is the account exposed to the session', async () => {
    const { sendTransaction, addTransaction, rejectRequest, approveRequest } =
      await setup();

    await sendTransaction({
      from: sessionAccount.toUpperCase().replace('0X', '0x'),
      to: otherWalletAccount,
    });

    expect(rejectRequest).not.toHaveBeenCalled();
    expect(addTransaction).toHaveBeenCalledTimes(1);
    expect(approveRequest).toHaveBeenCalledWith(
      expect.objectContaining({ result: '0xhash' }),
    );
  });
});
