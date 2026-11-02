import { OriginatorInfo } from '@metamask/sdk-communication-layer';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import { Connection } from '../Connection';
import SDKConnect from '../SDKConnect';
import handleConnectionReady from './handleConnectionReady';
import { setupBridge } from './setupBridge';

jest.mock('../../Engine', () => ({
  context: {
    ApprovalController: { get: jest.fn(), reject: jest.fn() },
  },
}));
jest.mock('../SDKConnect', () => ({
  __esModule: true,
  default: { getInstance: jest.fn() },
}));
jest.mock('./setupBridge', () => ({ setupBridge: jest.fn() }));
jest.mock('./checkPermissions', () => jest.fn());
jest.mock('./handleSendMessage', () => jest.fn());
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');

describe('handleConnectionReady deeplink re-connection', () => {
  const channelId = 'test-channel-id';
  const originatorInfo = {
    url: 'https://dapp.example',
    title: 'Dapp',
    apiVersion: '0.20.0',
  } as OriginatorInfo;

  const mockApproveHost = jest.fn();
  const mockDisapprove = jest.fn();
  const mockOnError = jest.fn();
  const mockUpdateOriginatorInfos = jest.fn();
  const mockSendMessage = jest.fn().mockResolvedValue(undefined);
  const mockGetConnections = jest.fn();

  const buildConnection = (liveKey: string | undefined) =>
    ({
      channelId,
      initialConnection: false,
      origin: AppConstants.DEEPLINKS.ORIGIN_DEEPLINK,
      trigger: 'deeplink',
      isReady: false,
      remote: {
        sendMessage: mockSendMessage,
        getKeyInfo: jest
          .fn()
          .mockReturnValue(
            liveKey === undefined
              ? undefined
              : { ecies: { otherPubKey: liveKey } },
          ),
      },
    } as unknown as Connection);

  const run = (connection: Connection) =>
    handleConnectionReady({
      originatorInfo,
      engine: Engine,
      connection,
      approveHost: mockApproveHost,
      disapprove: mockDisapprove,
      onError: mockOnError,
      updateOriginatorInfos: mockUpdateOriginatorInfos,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      getConnections: mockGetConnections,
    });
    mockGetConnections.mockReturnValue({
      [channelId]: { id: channelId, otherPublicKey: 'stored-dapp-key' },
    });
  });

  it('auto-approves when the live dapp key matches the stored session key', async () => {
    const connection = buildConnection('stored-dapp-key');

    await run(connection);

    expect(mockApproveHost).toHaveBeenCalledWith(
      expect.objectContaining({
        host: AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId,
      }),
    );
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'authorized' });
    expect(setupBridge).toHaveBeenCalled();
    expect(connection.isReady).toBe(true);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it.each([
    ['a different key', 'attacker-key'],
    ['no key info', undefined],
  ])(
    'does not auto-approve when the live dapp key is %s',
    async (_label, liveKey) => {
      const connection = buildConnection(liveKey);

      await run(connection);

      expect(mockApproveHost).not.toHaveBeenCalled();
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(setupBridge).not.toHaveBeenCalled();
      expect(connection.isReady).toBe(false);
      expect(mockDisapprove).toHaveBeenCalledWith(channelId);
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('does not auto-approve when the session is no longer stored', async () => {
    mockGetConnections.mockReturnValue({});
    const connection = buildConnection('stored-dapp-key');

    await run(connection);

    expect(mockApproveHost).not.toHaveBeenCalled();
    expect(setupBridge).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });
});
