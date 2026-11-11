import AppConstants from '../../AppConstants';
import getRpcMethodMiddleware from '../../RPCMethods/RPCMethodMiddleware';
import getDefaultBridgeParams from './getDefaultBridgeParams';
import { DappClient } from './dapp-sdk-types';

jest.mock('../../RPCMethods/RPCMethodMiddleware', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockGetRpcMethodMiddleware = getRpcMethodMiddleware as jest.Mock;
const CHANNEL_ID = '70a863a4-a756-4660-8c72-dc367d02f625';
const EXPECTED_ORIGIN = `${AppConstants.MM_SDK.SDK_REMOTE_ORIGIN}${CHANNEL_ID}`;

const createClient = (
  originatorInfo: Partial<DappClient['originatorInfo']>,
): DappClient => ({
  clientId: CHANNEL_ID,
  connected: true,
  originatorInfo: {
    url: 'https://example.com',
    title: 'Example',
    platform: 'ios',
    dappId: 'example',
    ...originatorInfo,
  } as DappClient['originatorInfo'],
});

describe('getDefaultBridgeParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['https://example.com', 'Example'],
    ['metamask', 'metamask'],
    ['', ''],
    [undefined, 'MetaMask Mobile'],
  ])(
    'uses the channel-scoped origin regardless of originatorInfo url=%p title=%p',
    (url, title) => {
      const params = getDefaultBridgeParams(
        createClient({ url: url as string, title }),
      );

      params.getRpcMethodMiddleware({
        hostname: 'ignored',
        getProviderState: jest.fn(),
      });

      expect(params.remoteConnHost).toBe(EXPECTED_ORIGIN);
      expect(mockGetRpcMethodMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: EXPECTED_ORIGIN,
          channelId: CHANNEL_ID,
          isMMSDK: true,
        }),
      );
    },
  );
});
