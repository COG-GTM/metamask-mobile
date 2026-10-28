import { MessageType, OriginatorInfo } from '@metamask/sdk-communication-layer';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import { ApprovalTypes } from '../../RPCMethods/RPCMethodMiddleware';
import { Connection } from '../Connection';
import { HOUR_IN_MS } from '../SDKConnectConstants';
import checkPermissions from './checkPermissions';
import handleConnectionReady from './handleConnectionReady';
import handleSendMessage from './handleSendMessage';
import { setupBridge } from './setupBridge';

jest.mock('../../Engine');
jest.mock('../utils/DevLogger');
jest.mock('../../../util/Logger');
jest.mock('../utils/wait.util');
jest.mock('./checkPermissions');
jest.mock('./handleSendMessage');
jest.mock('./setupBridge');
jest.mock('../utils/generateOTP.util', () => ({
  __esModule: true,
  default: () => [42, 7, 13],
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('handleConnectionReady - QR code reconnection', () => {
  const mockCheckPermissions = checkPermissions as jest.MockedFunction<
    typeof checkPermissions
  >;
  const mockHandleSendMessage = handleSendMessage as jest.MockedFunction<
    typeof handleSendMessage
  >;
  const mockSetupBridge = setupBridge as jest.MockedFunction<
    typeof setupBridge
  >;

  const originatorInfo = {
    url: 'https://dapp.example',
    title: 'Example dapp',
    icon: '',
    apiVersion: '0.20.0',
  } as OriginatorInfo;

  let approvalAdd: jest.Mock;
  let resolveApproval: (value: unknown) => void;
  let rejectApproval: (reason: unknown) => void;
  let connection: Connection;
  let disapprove: jest.Mock;
  let onError: jest.Mock;

  const run = () =>
    handleConnectionReady({
      originatorInfo,
      engine: Engine,
      connection,
      approveHost: jest.fn(),
      disapprove,
      onError,
      updateOriginatorInfos: jest.fn(),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    approvalAdd = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          resolveApproval = resolve;
          rejectApproval = reject;
        }),
    );
    (Engine.context as unknown) = {
      ApprovalController: {
        add: approvalAdd,
        get: jest.fn(),
        reject: jest.fn(),
      },
      KeyringController: {},
    };
    // Existing permissions: checkPermissions short-circuits to true.
    mockCheckPermissions.mockResolvedValue(true);
    mockHandleSendMessage.mockResolvedValue(undefined);
    mockSetupBridge.mockReturnValue(
      {} as unknown as ReturnType<typeof setupBridge>,
    );
    disapprove = jest.fn();
    onError = jest.fn();

    connection = {
      channelId: 'channel-1',
      origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
      initialConnection: false,
      isReady: false,
      lastAuthorized: 0,
      reconnectVerified: false,
      sendAuthorized: jest.fn(),
      remote: { hasRelayPersistence: () => false },
    } as unknown as Connection;
  });

  it('sends the OTP answer to the dapp and prompts with the generated codes', async () => {
    run();
    await flushPromises();

    expect(mockHandleSendMessage).toHaveBeenCalledWith({
      msg: { type: MessageType.OTP, otpAnswer: 42 },
      connection,
    });
    expect(approvalAdd).toHaveBeenCalledWith({
      id: 'channel-1',
      origin: 'channel-1',
      type: ApprovalTypes.CONNECT_ACCOUNTS,
      requestData: {
        pageMeta: expect.objectContaining({
          reconnect: true,
          origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
          channelId: 'channel-1',
          url: 'https://dapp.example',
          otps: [42, 7, 13],
        }),
      },
    });
  });

  it('does not send authorized before the user picks a code, even with existing permissions', async () => {
    run();
    await flushPromises();

    expect(connection.sendAuthorized).not.toHaveBeenCalled();
    expect(connection.isReady).toBe(false);
    expect(connection.reconnectVerified).toBe(false);
    expect(connection.reconnectVerification).toBeInstanceOf(Promise);
  });

  it('sends authorized only after the user picks the code sent to the dapp', async () => {
    const pending = run();
    await flushPromises();

    resolveApproval({ otpChoice: 42 });
    await pending;

    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
    expect(connection.reconnectVerified).toBe(true);
    expect(connection.isReady).toBe(true);
    expect(connection.lastAuthorized).toBeGreaterThan(0);
    expect(onError).not.toHaveBeenCalled();
  });

  it('refuses the reconnection when the user picks a wrong code', async () => {
    const pending = run();
    await flushPromises();

    resolveApproval({ otpChoice: 7 });
    await pending;

    expect(connection.sendAuthorized).not.toHaveBeenCalled();
    expect(connection.reconnectVerified).toBe(false);
    expect(connection.isReady).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('refuses the reconnection when the approval carries no code', async () => {
    const pending = run();
    await flushPromises();

    resolveApproval({});
    await pending;

    expect(connection.sendAuthorized).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('refuses the reconnection when the user rejects the prompt', async () => {
    const pending = run();
    await flushPromises();

    rejectApproval(new Error('User rejected'));
    await pending;

    expect(connection.sendAuthorized).not.toHaveBeenCalled();
    expect(connection.reconnectVerified).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('skips the OTP prompt within the expiration window after a verified reconnection', async () => {
    connection.lastAuthorized = Date.now() - HOUR_IN_MS / 2;

    await run();

    expect(approvalAdd).not.toHaveBeenCalled();
    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
    expect(connection.reconnectVerified).toBe(true);
  });

  it('requires the OTP prompt once the expiration window has passed', async () => {
    connection.lastAuthorized = Date.now() - HOUR_IN_MS - 1;

    run();
    await flushPromises();

    expect(approvalAdd).toHaveBeenCalledTimes(1);
    expect(connection.sendAuthorized).not.toHaveBeenCalled();
  });

  it('does not treat a future session expiry as recent activity', async () => {
    connection.lastAuthorized = Date.now() + 30 * 24 * HOUR_IN_MS;

    run();
    await flushPromises();

    expect(approvalAdd).toHaveBeenCalledTimes(1);
    expect(connection.sendAuthorized).not.toHaveBeenCalled();
  });

  it('still authorizes the initial QR code connection without an OTP', async () => {
    connection.initialConnection = true;

    await run();

    expect(approvalAdd).not.toHaveBeenCalled();
    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
  });
});
