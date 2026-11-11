import { Linking } from 'react-native';
import RNWalletConnect from '@walletconnect/client';
import Engine from '../Engine';
import { Minimizer } from '../NativeModules';
import WalletConnect from './WalletConnect';
import { flushPromises } from '../../util/test/utils';

jest.mock('@walletconnect/client');
jest.mock('../NativeModules', () => ({
  Minimizer: { goBack: jest.fn() },
}));
jest.mock('../BackgroundBridge/BackgroundBridge', () => jest.fn());
jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn(() => '1'),
}));
jest.mock('../../store', () => ({
  store: { getState: jest.fn(() => ({})) },
}));
jest.mock('../Engine', () => ({
  context: {
    KeyringController: { isUnlocked: jest.fn(() => true) },
    ApprovalController: { add: jest.fn() },
    AccountsController: {
      getSelectedAccount: jest.fn(() => ({ address: '0xABC' })),
    },
  },
}));

const ATTACKER_URL = 'https://attacker.example/';
const DAPP_URL = 'https://dapp.example';

type SessionRequestHandler = (
  error: Error | null,
  payload: unknown,
) => Promise<void>;

const sessionRequestPayload = (peerMeta?: Record<string, unknown>) => ({
  params: [peerMeta ? { peerMeta } : {}],
});

describe('WalletConnect v1 redirect', () => {
  let sessionRequestHandler: SessionRequestHandler | undefined;

  const runSessionRequest = async (peerMeta?: Record<string, unknown>) => {
    await sessionRequestHandler?.(null, sessionRequestPayload(peerMeta));
    await flushPromises();
    jest.advanceTimersByTime(300);
  };

  beforeAll(async () => {
    Object.defineProperty(RNWalletConnect.prototype, 'session', {
      configurable: true,
      get: () => ({ handshakeTopic: 'existing-session', key: 'existing-key' }),
    });
    await WalletConnect.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    sessionRequestHandler = undefined;
    jest
      .spyOn(RNWalletConnect.prototype, 'on')
      .mockImplementation((event: string, callback: unknown) => {
        if (event === 'session_request') {
          sessionRequestHandler = callback as SessionRequestHandler;
        }
      });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not open the deeplink redirect when the session is rejected', async () => {
    jest
      .mocked(Engine.context.ApprovalController.add)
      .mockRejectedValueOnce(new Error('User rejected'));

    await WalletConnect.newSession('URI', ATTACKER_URL, false, 'deeplink');
    await runSessionRequest({ url: ATTACKER_URL });

    expect(RNWalletConnect.prototype.rejectSession).toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Minimizer.goBack).toHaveBeenCalledTimes(1);
  });

  it('does not open the deeplink redirect when the session request fails', async () => {
    await WalletConnect.newSession('URI', ATTACKER_URL, false, 'deeplink');
    await runSessionRequest();

    expect(RNWalletConnect.prototype.rejectSession).toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Minimizer.goBack).toHaveBeenCalledTimes(1);
  });

  it('does not open a redirect on a different host than the approved dapp', async () => {
    await WalletConnect.newSession('URI', ATTACKER_URL, false, 'deeplink');
    await runSessionRequest({ url: DAPP_URL });

    expect(RNWalletConnect.prototype.approveSession).toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Minimizer.goBack).toHaveBeenCalledTimes(1);
  });

  it('does not open the dapp supplied dappScheme', async () => {
    await WalletConnect.newSession('URI', undefined, false, 'deeplink');
    await runSessionRequest({ url: DAPP_URL, dappScheme: 'otherapp' });

    expect(RNWalletConnect.prototype.approveSession).toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Minimizer.goBack).toHaveBeenCalledTimes(1);
  });

  it('opens an https redirect on the approved dapp host after approval', async () => {
    await WalletConnect.newSession(
      'URI',
      `${DAPP_URL}/connected`,
      false,
      'deeplink',
    );
    await runSessionRequest({ url: DAPP_URL });

    expect(Linking.openURL).toHaveBeenCalledWith(`${DAPP_URL}/connected`);
    expect(Minimizer.goBack).not.toHaveBeenCalled();
  });

  it('does not redirect at all for QR code sessions', async () => {
    await WalletConnect.newSession(
      'URI',
      `${DAPP_URL}/connected`,
      false,
      'qr-code',
    );
    await runSessionRequest({ url: DAPP_URL });

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Minimizer.goBack).not.toHaveBeenCalled();
  });
});
