import { MessageType } from '@metamask/sdk-communication-layer';
import { providerErrors } from '@metamask/rpc-errors';
import AppConstants from '../../AppConstants';
import { handleConnectionReady } from './handleConnectionReady';
import checkPermissions from './checkPermissions';
import { setupBridge } from './setupBridge';
import generateOTP from '../utils/generateOTP.util';
import handleSendMessage from './handleSendMessage';
import { HOUR_IN_MS } from '../SDKConnectConstants';

jest.mock('./checkPermissions', () => jest.fn().mockResolvedValue(undefined));
jest.mock('./setupBridge', () => ({
  setupBridge: jest.fn().mockReturnValue({ kind: 'bridge' }),
}));
jest.mock('../utils/generateOTP.util', () =>
  jest.fn().mockReturnValue([111, 222, 333]),
);
jest.mock('./handleSendMessage', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../utils/DevLogger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));

const makeApprovalController = () => ({
  get: jest.fn(),
  reject: jest.fn(),
});

const makeConnection = (overrides: Record<string, unknown> = {}) => ({
  channelId: 'channel-1',
  origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
  initialConnection: true,
  trigger: 'qr-code',
  isReady: false,
  receivedClientsReady: false,
  approvalPromise: undefined,
  backgroundBridge: undefined,
  originatorInfo: undefined,
  lastAuthorized: undefined,
  otps: undefined,
  remote: { sendMessage: jest.fn().mockResolvedValue(undefined) },
  sendAuthorized: jest.fn(),
  ...overrides,
});

const buildOriginator = (url = 'https://dapp.example/path') => ({
  url,
  title: 'Dapp',
  platform: 'web',
  source: 'src',
  dappId: 'd',
  icon: 'icon',
  apiVersion: '1.0.0',
});

describe('handleConnectionReady', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseArgs = () => ({
    engine: { context: { ApprovalController: makeApprovalController() } },
    approveHost: jest.fn(),
    disapprove: jest.fn(),
    updateOriginatorInfos: jest.fn(),
    onError: jest.fn(),
  });

  it('parses url without port and updates originator info', async () => {
    const args = baseArgs();
    const connection = makeConnection();

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator('https://dapp.example/path'),
    });

    expect(args.updateOriginatorInfos).toHaveBeenCalledWith({
      channelId: 'channel-1',
      originatorInfo: expect.objectContaining({ url: 'https://dapp.example' }),
    });
    expect(connection.receivedClientsReady).toBe(true);
  });

  it('preserves port in dapp URL', async () => {
    const args = baseArgs();
    const connection = makeConnection();

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator('http://dapp.example:8080/foo'),
    });

    expect(args.updateOriginatorInfos).toHaveBeenCalledWith({
      channelId: 'channel-1',
      originatorInfo: expect.objectContaining({
        url: 'http://dapp.example:8080',
      }),
    });
  });

  it('returns early when originatorInfo is falsy', async () => {
    const args = baseArgs();
    const connection = makeConnection();

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originatorInfo: undefined as any,
    });

    expect(args.updateOriginatorInfos).not.toHaveBeenCalled();
    expect(setupBridge).not.toHaveBeenCalled();
    expect(connection.receivedClientsReady).toBe(true);
  });

  it('rejects previous pending approval when apiVersion is missing', async () => {
    const approvalController = makeApprovalController();
    approvalController.get.mockReturnValue({ pending: true });
    const args = {
      ...baseArgs(),
      engine: { context: { ApprovalController: approvalController } },
    };
    const connection = makeConnection();
    const originator = buildOriginator();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (originator as any).apiVersion = undefined;

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: originator,
    });

    expect(approvalController.reject).toHaveBeenCalledWith(
      'channel-1',
      providerErrors.userRejectedRequest(),
    );
  });

  it('early-returns when connection.isReady is already true', async () => {
    const args = baseArgs();
    const connection = makeConnection({ isReady: true });

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(setupBridge).not.toHaveBeenCalled();
  });

  it('auto-approves on initial QR code connection and sets up bridge', async () => {
    const args = baseArgs();
    const connection = makeConnection();

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
    expect(setupBridge).toHaveBeenCalled();
    expect(connection.backgroundBridge).toEqual({ kind: 'bridge' });
    expect(connection.isReady).toBe(true);
  });

  it('re-checks permissions on recent QR reconnection', async () => {
    const args = baseArgs();
    const connection = makeConnection({
      initialConnection: false,
      lastAuthorized: Date.now() - 1000,
    });

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(args.disapprove).toHaveBeenCalledWith('channel-1');
    expect(checkPermissions).toHaveBeenCalled();
    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
  });

  it('sends an OTP when reconnecting from a stale QR session', async () => {
    const args = baseArgs();
    const connection = makeConnection({
      initialConnection: false,
      lastAuthorized: Date.now() - HOUR_IN_MS - 10_000,
    });

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(generateOTP).toHaveBeenCalled();
    expect(handleSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: { type: MessageType.OTP, otpAnswer: 111 },
      }),
    );
    expect(connection.lastAuthorized).toEqual(expect.any(Number));
  });

  it('auto-approves deeplink reconnection and notifies remote', async () => {
    const args = baseArgs();
    const connection = makeConnection({
      initialConnection: false,
      origin: AppConstants.DEEPLINKS.ORIGIN_DEEPLINK,
      trigger: 'deeplink',
    });

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(args.approveHost).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'clients_ready',
      }),
    );
    expect(connection.remote.sendMessage).toHaveBeenCalled();
  });

  it('checks permissions on initial deeplink connection', async () => {
    const args = baseArgs();
    const connection = makeConnection({
      initialConnection: true,
      origin: AppConstants.DEEPLINKS.ORIGIN_DEEPLINK,
    });

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(checkPermissions).toHaveBeenCalled();
    expect(connection.sendAuthorized).toHaveBeenCalledWith(true);
  });

  it('invokes onError when setupBridge throws', async () => {
    (setupBridge as jest.Mock).mockImplementationOnce(() => {
      throw new Error('bridge boom');
    });
    const args = baseArgs();
    const connection = makeConnection();

    await handleConnectionReady({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(args as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: connection as any,
      originatorInfo: buildOriginator(),
    });

    expect(args.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(connection.isReady).toBe(false);
  });
});
