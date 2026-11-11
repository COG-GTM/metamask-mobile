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
  },
}));
const MockEngine = jest.mocked(Engine);
jest.mock('uuid', () => ({
  v1: jest.fn(() => mockRandomId),
}));
const mockMinimizerGoBack = jest.fn();
jest.mock('../NativeModules', () => ({
  Minimizer: { goBack: () => mockMinimizerGoBack() },
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

  describe('redirect after session request', () => {
    const peerUrl = 'https://dapp.example';

    const rejectSessionWithRedirect = async (
      redirectUrl: unknown,
      requestOriginatedFrom = 'deeplink',
    ) => {
      // eslint-disable-next-line
      const FreshRNWalletConnect = require('@walletconnect/client').default;
      jest
        .spyOn(FreshRNWalletConnect.prototype, 'on')
        .mockImplementation((...args: unknown[]) => {
          const [event, callback] = args as [
            string,
            (error: Error | null, payload: unknown) => void,
          ];
          if (event === 'session_request') {
            callback(null, { params: [{ peerMeta: { url: peerUrl } }] });
          }
        });
      const rejectSession = jest
        .spyOn(FreshRNWalletConnect.prototype, 'rejectSession')
        .mockImplementation(jest.fn());
      // eslint-disable-next-line
      const WalletConnect = require('./WalletConnect').default;
      // eslint-disable-next-line
      const { Linking } = require('react-native');
      // eslint-disable-next-line
      const FreshEngine = require('../Engine');
      const openURL = jest
        .spyOn(Linking, 'openURL')
        .mockResolvedValue(undefined);
      FreshEngine.context.ApprovalController.add.mockRejectedValueOnce(
        new Error('User rejected'),
      );

      await WalletConnect.init();
      await WalletConnect.newSession(
        'URI',
        redirectUrl,
        mockAutoSign,
        requestOriginatedFrom,
      );
      await flushPromises();
      await new Promise((resolve) => setTimeout(resolve, 350));
      return { openURL, rejectSession };
    };

    beforeEach(() => {
      mockMinimizerGoBack.mockClear();
    });

    it.each([
      'https://evil.example/phish',
      'https://dapp.example.evil.example/',
      'http://dapp.example/',
      ['javascript', 'alert(1)'].join(':'),
      'metamask://wc?uri=x',
      'https://metamask.app.link/send/0x0',
      'tel:123',
    ])('does not open untrusted redirect %s', async (redirectUrl) => {
      const { openURL, rejectSession } = await rejectSessionWithRedirect(
        redirectUrl,
      );

      expect(rejectSession).toHaveBeenCalled();
      expect(openURL).not.toHaveBeenCalled();
      expect(mockMinimizerGoBack).toHaveBeenCalledTimes(1);
    });

    it('does not store a non-string redirect', async () => {
      const { openURL } = await rejectSessionWithRedirect([
        'https://dapp.example/',
      ]);

      expect(openURL).not.toHaveBeenCalled();
      expect(mockMinimizerGoBack).toHaveBeenCalledTimes(1);
    });

    it.each([
      'https://dapp.example/done',
      'https://app.dapp.example/',
      'dapp-app://done',
    ])('opens redirect %s that matches the dApp', async (redirectUrl) => {
      const { openURL } = await rejectSessionWithRedirect(redirectUrl);

      expect(openURL).toHaveBeenCalledWith(redirectUrl);
      expect(mockMinimizerGoBack).not.toHaveBeenCalled();
    });

    it('does not redirect when the request came from a QR code', async () => {
      const { openURL } = await rejectSessionWithRedirect(
        'https://dapp.example/done',
        'qr-code',
      );

      expect(openURL).not.toHaveBeenCalled();
      expect(mockMinimizerGoBack).not.toHaveBeenCalled();
    });
  });
});
