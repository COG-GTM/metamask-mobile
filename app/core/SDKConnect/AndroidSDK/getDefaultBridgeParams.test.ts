import getDefaultBridgeParams, {
  getSdkClientHostname,
} from './getDefaultBridgeParams';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';
import AppConstants from '../../AppConstants';
import { DappClient } from './dapp-sdk-types';

jest.mock('../../RPCMethods/RPCMethodMiddleware', () => jest.fn());

const buildClient = (url?: string, title?: string): DappClient =>
  ({
    clientId: 'channel-id',
    connected: true,
    originatorInfo: { url, title, platform: 'web' },
  } as unknown as DappClient);

describe('getDefaultBridgeParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the originator url as hostname for regular dapps', () => {
    const client = buildClient('https://dapp.example', 'Dapp');
    expect(getSdkClientHostname(client)).toBe('https://dapp.example');
    expect(getDefaultBridgeParams(client).remoteConnHost).toBe(
      'https://dapp.example',
    );
  });

  it.each([
    ['url', process.env.MM_FOX_CODE, 'Dapp'],
    ['title', undefined, process.env.MM_FOX_CODE],
    [
      'non-matching url with internal title',
      'https://x',
      process.env.MM_FOX_CODE,
    ],
    [
      'prefixed url',
      `${AppConstants.MM_SDK.SDK_REMOTE_ORIGIN}${process.env.MM_FOX_CODE}`,
      'Dapp',
    ],
    ['metamask origin', 'metamask', 'Dapp'],
  ])(
    'does not let originatorInfo %s impersonate an internal origin',
    (_, url, title) => {
      const client = buildClient(url, title);
      const params = getDefaultBridgeParams(client);

      expect(params.remoteConnHost).toBe('channel-id');

      params.getRpcMethodMiddleware({
        hostname: 'ignored',
        getProviderState: jest.fn(),
      });

      expect(getRpcMethodMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'channel-id',
          channelId: 'channel-id',
        }),
      );
      expect(getRpcMethodMiddleware).not.toHaveBeenCalledWith(
        expect.objectContaining({ hostname: process.env.MM_FOX_CODE }),
      );
    },
  );
});
