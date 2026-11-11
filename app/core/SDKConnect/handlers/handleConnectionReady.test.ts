import { OriginatorInfo } from '@metamask/sdk-communication-layer';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import { Connection } from '../Connection';
import SDKConnect from '../SDKConnect';
import checkPermissions from './checkPermissions';
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
      expect(mockUpdateOriginatorInfos).not.toHaveBeenCalled();
      expect(connection.originatorInfo).toBeUndefined();
    },
  );

  it.each([
    ['the session is no longer stored', {}],
    [
      'the stored session has no dapp key',
      { [channelId]: { id: channelId, otherPublicKey: '' } },
    ],
  ])(
    'asks for a fresh approval instead of auto-approving when %s',
    async (_label, connections) => {
      mockGetConnections.mockReturnValue(connections);
      (checkPermissions as jest.Mock).mockResolvedValue(true);
      const connection = buildConnection('some-key');

      await run(connection);

      expect(mockDisapprove).toHaveBeenCalledWith(channelId);
      expect(checkPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ connection, requireFreshApproval: true }),
      );
      expect(mockApproveHost).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith({ type: 'authorized' });
      expect(connection.isReady).toBe(true);
      expect(mockOnError).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['rejects', () => Promise.reject(new Error('User rejected'))],
    ['grants no accounts', () => Promise.resolve(false)],
  ])(
    'does not approve a keyless session when the user %s the fresh approval',
    async (_label, outcome) => {
      mockGetConnections.mockReturnValue({});
      (checkPermissions as jest.Mock).mockImplementation(outcome);
      const connection = buildConnection('some-key');

      await run(connection);

      expect(mockApproveHost).not.toHaveBeenCalled();
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(setupBridge).not.toHaveBeenCalled();
      expect(connection.isReady).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('does not consult the stored key for an initial deeplink connection', async () => {
    (checkPermissions as jest.Mock).mockResolvedValue(true);
    const connection = buildConnection('attacker-key');
    (connection as { initialConnection: boolean }).initialConnection = true;
    (connection as unknown as { sendAuthorized: jest.Mock }).sendAuthorized =
      jest.fn();

    await run(connection);

    expect(mockGetConnections).not.toHaveBeenCalled();
    expect(checkPermissions).toHaveBeenCalledWith({
      connection,
      engine: Engine,
    });
  });
});
