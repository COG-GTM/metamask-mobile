import getDefaultBridgeParams from './getDefaultBridgeParams';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';
import AppConstants from '../../AppConstants';
import type { DappClient } from './dapp-sdk-types';

jest.mock('../../RPCMethods/RPCMethodMiddleware', () => jest.fn(() => 'middleware'));

const buildClient = (overrides: Partial<DappClient> = {}): DappClient => ({
  clientId: 'client-1',
  connected: true,
  validUntil: 0,
  originatorInfo: {
    url: 'https://dapp.example',
    title: 'Dapp Title',
    platform: 'web',
    source: 'browser',
    dappId: 'dapp-1',
    icon: 'https://dapp.example/icon.png',
    apiVersion: '1.0.0',
  },
  ...overrides,
});

describe('getDefaultBridgeParams', () => {
  beforeEach(() => {
    (getRpcMethodMiddleware as jest.Mock).mockClear();
  });

  it('returns params with isMainFrame true and isWalletConnect false', () => {
    const params = getDefaultBridgeParams(buildClient());
    expect(params.isMainFrame).toBe(true);
    expect(params.isWalletConnect).toBe(false);
    expect(params.wcRequestActions).toBeUndefined();
  });

  it('uses the originator url as remoteConnHost when available', () => {
    const params = getDefaultBridgeParams(buildClient());
    expect(params.remoteConnHost).toBe('https://dapp.example');
  });

  it('falls back to originator title when url is nullish', () => {
    const client = buildClient({
      originatorInfo: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: undefined as any,
        title: 'Dapp Title',
        platform: 'web',
        source: 'browser',
        dappId: 'dapp-1',
        icon: 'icon',
        apiVersion: '1.0.0',
      },
    });
    const params = getDefaultBridgeParams(client);
    expect(params.remoteConnHost).toBe('Dapp Title');
  });

  it('getApprovedHosts returns an object with the host marked true', () => {
    const params = getDefaultBridgeParams(buildClient());
    expect(params.getApprovedHosts('the-host')).toEqual({ 'the-host': true });
  });

  it('delegates to getRpcMethodMiddleware with channel id, hostname, and analytics', () => {
    const params = getDefaultBridgeParams(buildClient());
    const getProviderState = jest.fn();

    params.getRpcMethodMiddleware({ hostname: 'ignored', getProviderState });

    expect(getRpcMethodMiddleware).toHaveBeenCalledTimes(1);
    const arg = (getRpcMethodMiddleware as jest.Mock).mock.calls[0][0];
    expect(arg.hostname).toBe('https://dapp.example');
    expect(arg.channelId).toBe('client-1');
    expect(arg.getProviderState).toBe(getProviderState);
    expect(arg.isMMSDK).toBe(true);
    expect(arg.isWalletConnect).toBe(false);
    expect(arg.analytics.isRemoteConn).toBe(true);
    expect(arg.analytics.platform).toBe('web');
  });

  it('falls back to MM_SDK.UNKNOWN_PARAM when platform is nullish', () => {
    const client = buildClient({
      originatorInfo: {
        url: 'https://dapp.example',
        title: 'Title',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        platform: undefined as any,
        source: 'browser',
        dappId: 'dapp',
        icon: 'icon',
        apiVersion: '1.0.0',
      },
    });
    const params = getDefaultBridgeParams(client);
    params.getRpcMethodMiddleware({ hostname: 'x', getProviderState: jest.fn() });
    const arg = (getRpcMethodMiddleware as jest.Mock).mock.calls[0][0];
    expect(arg.analytics.platform).toBe(AppConstants.MM_SDK.UNKNOWN_PARAM);
  });
});
