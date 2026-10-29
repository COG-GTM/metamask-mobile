import { OriginatorInfo } from '@metamask/sdk-communication-layer';
import Engine from '../../Engine';
import { Connection } from '../Connection';
import checkPermissions from './checkPermissions';
import handleConnectionReady from './handleConnectionReady';
import handleSendMessage from './handleSendMessage';

jest.mock('../../Engine');
jest.mock('./checkPermissions');
jest.mock('./handleSendMessage');
jest.mock('./setupBridge', () => ({
  setupBridge: jest.fn().mockReturnValue({}),
}));
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');

describe('handleConnectionReady', () => {
  const mockCheckPermissions = checkPermissions as jest.MockedFunction<
    typeof checkPermissions
  >;
  const mockHandleSendMessage = handleSendMessage as jest.MockedFunction<
    typeof handleSendMessage
  >;
  const mockApproveHost = jest.fn();
  const mockDisapprove = jest.fn();
  const mockOnError = jest.fn();
  const mockUpdateOriginatorInfos = jest.fn();
  const mockSendAuthorized = jest.fn();
  const mockRemoteSendMessage = jest.fn().mockResolvedValue(undefined);

  const originatorInfo = {
    url: 'https://dapp.example',
    title: 'Dapp',
    apiVersion: '0.20.0',
  } as OriginatorInfo;

  let connection: Connection;
  let engine: typeof Engine;

  const run = () =>
    handleConnectionReady({
      originatorInfo,
      engine,
      connection,
      approveHost: mockApproveHost,
      disapprove: mockDisapprove,
      onError: mockOnError,
      updateOriginatorInfos: mockUpdateOriginatorInfos,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleSendMessage.mockResolvedValue(undefined);
    engine = {
      context: {
        ApprovalController: { get: jest.fn(), reject: jest.fn() },
      },
    } as unknown as typeof Engine;
    connection = {
      channelId: 'channel-id',
      origin: 'qr-code',
      initialConnection: false,
      isReady: false,
      requiresReapproval: false,
      sendAuthorized: mockSendAuthorized,
      remote: { sendMessage: mockRemoteSendMessage },
    } as unknown as Connection;
  });

  describe('QR code reconnection with expired OTP window', () => {
    it('forces a permission prompt and authorizes only after approval', async () => {
      mockCheckPermissions.mockResolvedValue(true);

      await run();

      expect(mockHandleSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: expect.objectContaining({ otpAnswer: connection.otps?.[0] }),
        }),
      );
      expect(mockCheckPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ connection, forcePrompt: true }),
      );
      expect(mockSendAuthorized).toHaveBeenCalledWith(true);
      expect(connection.isReady).toBe(true);
    });

    it('does not authorize when the user rejects', async () => {
      mockCheckPermissions.mockRejectedValue(new Error('User rejected'));

      await run();

      expect(mockSendAuthorized).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
      expect(connection.isReady).toBe(false);
    });

    it('does not authorize when no account is permitted after the prompt', async () => {
      mockCheckPermissions.mockResolvedValue(false);

      await run();

      expect(mockSendAuthorized).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe('peer key changed', () => {
    beforeEach(() => {
      connection.origin = 'deeplink';
      connection.trigger = 'deeplink';
      connection.requiresReapproval = true;
    });

    it('does not auto-approve deeplink reconnections and forces a prompt', async () => {
      mockCheckPermissions.mockImplementation(async () => {
        expect(mockApproveHost).not.toHaveBeenCalled();
        return true;
      });

      await run();

      // approveHost only persists the approval after the user accepted.
      expect(mockApproveHost).toHaveBeenCalledTimes(1);
      expect(mockRemoteSendMessage).not.toHaveBeenCalled();
      expect(mockDisapprove).toHaveBeenCalledWith('channel-id');
      expect(mockCheckPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ connection, forcePrompt: true }),
      );
      expect(mockSendAuthorized).toHaveBeenCalledWith(true);
    });

    it('does not authorize when the user rejects', async () => {
      mockCheckPermissions.mockRejectedValue(new Error('User rejected'));

      await run();

      expect(mockApproveHost).not.toHaveBeenCalled();
      expect(mockSendAuthorized).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('still auto-approves deeplink reconnections with an unchanged key', async () => {
    connection.origin = 'deeplink';
    connection.trigger = 'deeplink';

    await run();

    expect(mockCheckPermissions).not.toHaveBeenCalled();
    expect(mockApproveHost).toHaveBeenCalled();
  });
});
