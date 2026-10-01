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
jest.mock('../../util/Logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../Engine', () => ({
  context: {
    KeyringController: {
      isUnlocked: jest.fn().mockReturnValueOnce(true),
    },
    ApprovalController: {
      add: jest.fn(),
    },
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
  it('does not log WalletConnect session payloads', async () => {
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    // eslint-disable-next-line
    const MockLogger = jest.mocked(require('../../util/Logger'));
    jest
      // eslint-disable-next-line
      .spyOn(require('@walletconnect/client').default.prototype, 'on')
      .mockImplementationOnce((_, callback) => {
        (callback as (...args: unknown[]) => void)(null, mockSessionRequest);
      });

    await WalletConnect.init();
    await WalletConnect.newSession(
      'URI',
      mockRedirectUrl,
      mockAutoSign,
      'origin',
    );
    await flushPromises();

    expect(MockLogger.log).toHaveBeenCalledWith('WC session_request', {
      id: undefined,
    });
    const logged = JSON.stringify(MockLogger.log.mock.calls);
    expect(logged).not.toContain(mockDappUrl);
    expect(logged).not.toContain('peerMeta');
  });
  it('does not log call_request or session_update payloads', async () => {
    const mockAccount = '0x1234567890abcdef1234567890abcdef12345678';
    // eslint-disable-next-line
    const WalletConnect = require('./WalletConnect').default;
    // eslint-disable-next-line
    const MockLogger = jest.mocked(require('../../util/Logger'));
    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    jest
      // eslint-disable-next-line
      .spyOn(require('@walletconnect/client').default.prototype, 'on')
      .mockImplementation((event, callback) => {
        handlers[event as string] = callback as (...args: unknown[]) => unknown;
      });

    await WalletConnect.init();
    await WalletConnect.newSession(
      'URI',
      mockRedirectUrl,
      mockAutoSign,
      'origin',
    );
    const connector = WalletConnect.connectors().at(-1);
    connector.walletConnector.session = {
      peerMeta: { url: 'https://other.example' },
    };
    connector.backgroundBridge = { hostname: mockDappHost };
    MockLogger.log.mockClear();

    await handlers.call_request(null, {
      id: 7,
      method: 'eth_sendTransaction',
      params: [
        { from: mockAccount, to: mockAccount, value: '0x1', data: '0xab' },
      ],
    });
    handlers.session_update(null, { params: [{ accounts: [mockAccount] }] });
    await flushPromises();

    expect(MockLogger.log).toHaveBeenCalledWith('CALL_REQUEST', {
      id: 7,
      method: 'eth_sendTransaction',
    });
    expect(MockLogger.log).toHaveBeenCalledWith('WC: Session update');
    expect(JSON.stringify(MockLogger.log.mock.calls)).not.toContain(
      mockAccount,
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
