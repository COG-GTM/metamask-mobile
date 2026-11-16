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
jest.mock('../NativeModules', () => ({
  Minimizer: {
    goBack: jest.fn(),
  },
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
  const sessionAccount = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
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

describe('WalletConnect v1 call_request', () => {
  const sessionAccount = '0x0000000000000000000000000000000000000001';
  const otherWalletAccount = '0x0000000000000000000000000000000000000002';
  const dappRedirectUrl = 'https://metamask.io/redirect';

  const setup = async ({
    requestOriginatedFrom,
    redirectUrl,
  }: { requestOriginatedFrom?: string; redirectUrl?: string } = {}) => {
    jest.resetModules();
    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
    const RNWC = require('@walletconnect/client').default;
    const EngineMock = require('../Engine');
    const StorageWrapper = require('../../store/storage-wrapper');
    const AppConstants = require('../AppConstants').default;
    const { addTransaction } = require('../../util/transaction-controller');
    const ppomUtil = require('../../lib/ppom/ppom-util');
    const BackgroundBridgeModule = require('../BackgroundBridge/BackgroundBridge');
    const { Linking } = require('react-native');
    const { Minimizer } = require('../NativeModules');
    const { store } = require('../../store');
    const { selectEvmChainId } = require('../../selectors/networkController');
    const initialRootState =
      require('../../util/test/initial-root-state').default;
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

    // Mainnet selected, so the account/chain check resolves an active chain.
    jest.spyOn(store, 'getState').mockReturnValue(initialRootState);

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
    jest.spyOn(RNWC.prototype, 'updateSession').mockImplementation(jest.fn());
    const rejectRequest = jest
      .spyOn(RNWC.prototype, 'rejectRequest')
      .mockImplementation(jest.fn());
    const approveRequest = jest
      .spyOn(RNWC.prototype, 'approveRequest')
      .mockImplementation(jest.fn());
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const goBack = jest
      .spyOn(Minimizer, 'goBack')
      .mockImplementation(jest.fn());

    EngineMock.context.KeyringController.isUnlocked.mockReset();
    EngineMock.context.KeyringController.isUnlocked.mockReturnValue(true);
    EngineMock.context.AccountsController.getSelectedAccount.mockReturnValue({
      address: sessionAccount,
    });
    EngineMock.context.NetworkController.findNetworkClientIdByChainId.mockReturnValue(
      'network-client-id',
    );
    addTransaction.mockReset();
    addTransaction.mockResolvedValue({
      transactionMeta: { id: 'tx-id' },
      result: Promise.resolve('0xhash'),
    });
    ppomUtil.validateRequest.mockClear();

    jest.spyOn(StorageWrapper, 'getItem').mockResolvedValue(
      JSON.stringify([
        {
          peerMeta: { url: mockDappUrl },
          requestOriginatedFrom:
            requestOriginatedFrom ?? AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
          ...(redirectUrl ? { redirectUrl } : {}),
        },
      ]),
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const WalletConnect = require('./WalletConnect').default;
    await WalletConnect.init();
    await flushPromises();

    const setPeerUrl = (url: string) =>
      Object.defineProperty(connector, 'session', {
        configurable: true,
        value: { peerMeta: { url } },
      });
    setPeerUrl(mockDappUrl);

    const BackgroundBridgeMock =
      BackgroundBridgeModule.default ?? BackgroundBridgeModule;
    const backgroundBridge =
      BackgroundBridgeMock.mock.results[
        BackgroundBridgeMock.mock.results.length - 1
      ].value;
    const { wcRequestActions } =
      BackgroundBridgeMock.mock.calls[
        BackgroundBridgeMock.mock.calls.length - 1
      ][0];

    let nextId = 1000;
    const callRequest = async (
      payload: Record<string, unknown>,
      { flush = true }: { flush?: boolean } = {},
    ) => {
      const promise = handlers.call_request(null, {
        id: nextId++,
        ...payload,
      });
      if (flush) {
        await promise;
        await flushPromises();
      }
      return promise;
    };

    return {
      callRequest,
      setPeerUrl,
      backgroundBridge,
      wcRequestActions,
      activeChainId: selectEvmChainId(store.getState()),
      EngineMock,
      addTransaction,
      ppomUtil,
      rejectRequest,
      approveRequest,
      openURL,
      goBack,
      AppConstants,
    };
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds the transaction with the WalletConnect origin, validates it with PPOM and approves with the hash', async () => {
    const {
      callRequest,
      activeChainId,
      EngineMock,
      addTransaction,
      ppomUtil,
      approveRequest,
      rejectRequest,
      backgroundBridge,
    } = await setup();

    await callRequest({
      id: 1,
      method: 'eth_sendTransaction',
      params: [
        {
          from: sessionAccount,
          to: otherWalletAccount,
          value: '0x1',
          data: '0xabcd',
          chainId: activeChainId,
        },
      ],
    });

    expect(
      EngineMock.context.NetworkController.findNetworkClientIdByChainId,
    ).toHaveBeenCalledWith(activeChainId);
    expect(addTransaction).toHaveBeenCalledTimes(1);
    expect(addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ from: sessionAccount, to: otherWalletAccount }),
      {
        deviceConfirmedOn: 'metamask_mobile',
        networkClientId: 'network-client-id',
        origin: `wc::${mockDappUrl}`,
      },
    );
    expect(ppomUtil.validateRequest).toHaveBeenCalledWith(
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        origin: mockDappUrl,
        params: [
          {
            from: sessionAccount,
            to: otherWalletAccount,
            value: '0x1',
            data: '0xabcd',
          },
        ],
      },
      'tx-id',
    );
    expect(approveRequest).toHaveBeenCalledWith({ id: 1, result: '0xhash' });
    expect(rejectRequest).not.toHaveBeenCalled();
    expect(backgroundBridge.onMessage).not.toHaveBeenCalled();
  });

  it('rejects the request with the error when addTransaction fails', async () => {
    const {
      callRequest,
      addTransaction,
      approveRequest,
      rejectRequest,
      ppomUtil,
    } = await setup();
    const error = new Error('addTransaction failed');
    addTransaction.mockRejectedValueOnce(error);

    await callRequest({
      id: 2,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    });

    expect(ppomUtil.validateRequest).not.toHaveBeenCalled();
    expect(approveRequest).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledWith({ id: 2, error });
  });

  it('rejects the request when the user rejects the transaction', async () => {
    const { callRequest, addTransaction, approveRequest, rejectRequest } =
      await setup();
    const error = new Error('User rejected the transaction');
    const result = Promise.reject(error);
    result.catch(() => undefined);
    addTransaction.mockResolvedValueOnce({
      transactionMeta: { id: 'tx-id' },
      result,
    });

    await callRequest({
      id: 3,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    });

    expect(approveRequest).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledWith({ id: 3, error });
  });

  it('rejects a transaction whose from is not the session account before adding it', async () => {
    const { callRequest, addTransaction, approveRequest, rejectRequest } =
      await setup();

    await callRequest({
      id: 4,
      method: 'eth_sendTransaction',
      params: [{ from: otherWalletAccount, to: sessionAccount }],
    });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(approveRequest).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledWith({
      id: 4,
      error: expect.objectContaining({
        message:
          'Invalid parameters: must provide a permitted Ethereum address.',
      }),
    });
  });

  it('rejects a transaction for a chain other than the active chain before adding it', async () => {
    const { callRequest, activeChainId, addTransaction, rejectRequest } =
      await setup();
    const otherChainId = activeChainId === '0x1' ? '0x89' : '0x1';

    await callRequest({
      id: 5,
      method: 'eth_sendTransaction',
      params: [
        { from: sessionAccount, to: otherWalletAccount, chainId: otherChainId },
      ],
    });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(rejectRequest).toHaveBeenCalledWith({
      id: 5,
      error: expect.objectContaining({
        message:
          'Invalid parameters: active chainId is different than the one provided.',
      }),
    });
  });

  it('rewrites eth_signTypedData to eth_signTypedData_v3 and forwards it to the background bridge', async () => {
    const { callRequest, backgroundBridge, addTransaction } = await setup();

    await callRequest({
      id: 6,
      method: 'eth_signTypedData',
      params: [sessionAccount, '{}'],
    });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(backgroundBridge.onMessage).toHaveBeenCalledWith({
      name: 'walletconnect-provider',
      data: {
        id: 6,
        method: 'eth_signTypedData_v3',
        params: [sessionAccount, '{}'],
      },
      origin: mockDappHost,
    });
  });

  it('redirects back to the dapp after approving a redirect method', async () => {
    const { callRequest, approveRequest, openURL, goBack, AppConstants } =
      await setup({
        requestOriginatedFrom: 'deeplink',
        redirectUrl: dappRedirectUrl,
      });
    expect(AppConstants.DEEPLINKS.ORIGIN_DEEPLINK).toBe('deeplink');
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });

    await callRequest({
      id: 7,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    });

    expect(approveRequest).toHaveBeenCalledWith({ id: 7, result: '0xhash' });
    expect(openURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(dappRedirectUrl);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('redirects back to the dapp after rejecting a redirect method', async () => {
    const { callRequest, rejectRequest, openURL } = await setup({
      requestOriginatedFrom: 'deeplink',
      redirectUrl: dappRedirectUrl,
    });
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });

    await callRequest({
      id: 8,
      method: 'eth_sendTransaction',
      params: [{ from: otherWalletAccount, to: sessionAccount }],
    });

    expect(rejectRequest).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300);
    expect(openURL).toHaveBeenCalledWith(dappRedirectUrl);
  });

  it('does not redirect for a method outside METHODS_TO_REDIRECT', async () => {
    const { callRequest, backgroundBridge, wcRequestActions, openURL, goBack } =
      await setup({
        requestOriginatedFrom: 'deeplink',
        redirectUrl: dappRedirectUrl,
      });
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });

    await callRequest({ id: 9, method: 'eth_chainId', params: [] });

    expect(backgroundBridge.onMessage).toHaveBeenCalledTimes(1);
    wcRequestActions.approveRequest({ id: 9, result: '0x1' });
    jest.advanceTimersByTime(300);
    expect(openURL).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it('does not redirect sessions that originated from a QR code', async () => {
    const { callRequest, approveRequest, openURL, goBack } = await setup({
      redirectUrl: dappRedirectUrl,
    });
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });

    await callRequest({
      id: 10,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    });

    expect(approveRequest).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300);
    expect(openURL).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it('ignores a duplicate payload id while the first request is in flight', async () => {
    const { callRequest, addTransaction, approveRequest } = await setup();
    let resolveHash: (hash: string) => void = () => undefined;
    addTransaction.mockResolvedValueOnce({
      transactionMeta: { id: 'tx-id' },
      result: new Promise<string>((resolve) => {
        resolveHash = resolve;
      }),
    });
    const payload = {
      id: 11,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    };

    const first = callRequest(payload, { flush: false });
    await flushPromises();
    await callRequest(payload);

    expect(addTransaction).toHaveBeenCalledTimes(1);

    resolveHash('0xhash');
    await first;
    await flushPromises();

    expect(approveRequest).toHaveBeenCalledTimes(1);
    expect(approveRequest).toHaveBeenCalledWith({ id: 11, result: '0xhash' });
  });

  it('does not forward or add transactions when the peer hostname does not match the session', async () => {
    const {
      callRequest,
      setPeerUrl,
      backgroundBridge,
      addTransaction,
      approveRequest,
      rejectRequest,
    } = await setup();
    setPeerUrl('https://evil.example');

    await callRequest({
      id: 12,
      method: 'eth_sendTransaction',
      params: [{ from: sessionAccount, to: otherWalletAccount }],
    });
    await callRequest({ id: 13, method: 'personal_sign', params: [] });

    expect(addTransaction).not.toHaveBeenCalled();
    expect(backgroundBridge.onMessage).not.toHaveBeenCalled();
    expect(approveRequest).not.toHaveBeenCalled();
    expect(rejectRequest).not.toHaveBeenCalled();
  });

  it('waits for the keychain to unlock before handling the request', async () => {
    const { callRequest, EngineMock, backgroundBridge } = await setup();
    EngineMock.context.KeyringController.isUnlocked
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValue(true);
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });

    const pending = callRequest(
      { id: 14, method: 'eth_chainId', params: [] },
      { flush: false },
    );
    await Promise.resolve();
    expect(backgroundBridge.onMessage).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(2000);
    await pending;

    expect(backgroundBridge.onMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: 14, method: 'eth_chainId' }),
      }),
    );
  });
});
