import { OriginatorInfo } from '@metamask/sdk-communication-layer';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import { Connection } from '../Connection';
import handleConnectionReady from './handleConnectionReady';
import { setupBridge } from './setupBridge';

jest.mock('../../Engine');
jest.mock('../Connection');
jest.mock('./checkPermissions', () => jest.fn().mockResolvedValue(true));
jest.mock('./handleSendMessage', () => jest.fn().mockResolvedValue(undefined));
jest.mock('./setupBridge', () => ({
  setupBridge: jest.fn().mockReturnValue({}),
}));
jest.mock('../utils/DevLogger', () => ({ log: jest.fn() }));

describe('handleConnectionReady', () => {
  const mockSetupBridge = setupBridge as jest.MockedFunction<
    typeof setupBridge
  >;
  const updateOriginatorInfos = jest.fn();

  const run = async (url: string) => {
    const connection = {
      channelId: 'channel-1',
      initialConnection: true,
      origin: AppConstants.DEEPLINKS.ORIGIN_DEEPLINK,
      isReady: false,
      sendAuthorized: jest.fn(),
      approvalPromise: undefined,
    } as unknown as Connection;
    const engine = {
      context: { ApprovalController: { get: jest.fn(), reject: jest.fn() } },
    } as unknown as typeof Engine;

    await handleConnectionReady({
      originatorInfo: {
        url,
        title: 'Dapp',
        apiVersion: '0.20.0',
        platform: 'web',
      } as OriginatorInfo,
      engine,
      connection,
      approveHost: jest.fn(),
      disapprove: jest.fn(),
      updateOriginatorInfos,
      onError: (e) => {
        throw e;
      },
    });
    return connection;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the normalized origin to setupBridge', async () => {
    const connection = await run('https://dapp.example.com:8443/some/path');

    expect(mockSetupBridge).toHaveBeenCalledTimes(1);
    expect(mockSetupBridge.mock.calls[0][0].originatorInfo.url).toBe(
      'https://dapp.example.com:8443',
    );
    expect(connection.originatorInfo?.url).toBe(
      'https://dapp.example.com:8443',
    );
  });

  it.each(['my-dapp', 'not a url'])(
    'does not forward a malformed declared url (%p) to setupBridge',
    async (url) => {
      const connection = await run(url);

      expect(mockSetupBridge).toHaveBeenCalledTimes(1);
      expect(mockSetupBridge.mock.calls[0][0].originatorInfo.url).toBe('');
      expect(connection.originatorInfo?.url).toBe('');
      expect(updateOriginatorInfos).toHaveBeenCalledWith({
        channelId: 'channel-1',
        originatorInfo: expect.objectContaining({ url: '' }),
      });
    },
  );
});
