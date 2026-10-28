import { ApprovalController } from '@metamask/approval-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { providerErrors } from '@metamask/rpc-errors';
import AppConstants from '../../AppConstants';
import Engine from '../../Engine';
import { ApprovalTypes } from '../../RPCMethods/RPCMethodMiddleware';
import { Connection } from '../Connection';
import DevLogger from '../utils/DevLogger';
import { wait, waitForKeychainUnlocked } from '../utils/wait.util';

// How long an RPC that arrived before clients_ready waits for verification to start.
const VERIFICATION_START_MAX_WAIT_LOOPS = 60;

/**
 * True for a QR-code channel that is resuming an existing session rather than
 * completing its first connection.
 */
export const isQRReconnection = (connection: Connection) =>
  connection.origin === AppConstants.DEEPLINKS.ORIGIN_QR_CODE &&
  !connection.initialConnection;

/**
 * True while a reconnected QR-code channel has not passed OTP re-authorization.
 * Relay-persisted channels skip clients_ready entirely and are not gated here.
 */
export const requiresQRReconnectionVerification = (connection: Connection) =>
  isQRReconnection(connection) &&
  !connection.remote?.hasRelayPersistence?.() &&
  !connection.reconnectVerified;

/**
 * Opens the OTP re-authorization prompt and resolves to true only when the user
 * picked the code that was sent to the dapp (connection.otps[0]).
 */
export const requestOTPVerification = async ({
  connection,
  engine,
}: {
  connection: Connection;
  engine: typeof Engine;
}): Promise<boolean> => {
  const expectedOTP = connection.otps?.[0];
  if (expectedOTP === undefined || !connection.otps) {
    return false;
  }

  const {
    ApprovalController: approvalController,
    KeyringController: keyringController,
  } = engine.context as {
    ApprovalController: ApprovalController;
    KeyringController: KeyringController;
  };

  await waitForKeychainUnlocked({
    keyringController,
    context: 'verifyQRReconnection',
  });

  try {
    const result = (await approvalController.add({
      id: connection.channelId,
      origin: connection.channelId,
      type: ApprovalTypes.CONNECT_ACCOUNTS,
      requestData: {
        pageMeta: {
          reconnect: true,
          origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
          channelId: connection.channelId,
          url: connection.originatorInfo?.url ?? '',
          title: connection.originatorInfo?.title ?? '',
          icon: connection.originatorInfo?.icon ?? '',
          apiVersion: connection.originatorInfo?.apiVersion ?? '',
          otps: [...connection.otps],
        },
      },
    })) as { otpChoice?: unknown } | undefined;

    const verified = result?.otpChoice === expectedOTP;
    DevLogger.log(
      `verifyQRReconnection channelId=${connection.channelId} verified=${verified}`,
    );
    return verified;
  } catch (error) {
    DevLogger.log(
      `verifyQRReconnection channelId=${connection.channelId} rejected`,
      error,
    );
    return false;
  }
};

/**
 * Blocks RPC handling for a QR reconnection until OTP re-authorization succeeds.
 * Requests that arrive before clients_ready wait for the verification to start.
 */
export const assertQRReconnectionVerified = async (
  connection: Connection,
  {
    waitTime = 1000,
    maxWaitLoops = VERIFICATION_START_MAX_WAIT_LOOPS,
  }: { waitTime?: number; maxWaitLoops?: number } = {},
) => {
  let i = 0;
  while (
    requiresQRReconnectionVerification(connection) &&
    !connection.reconnectVerification &&
    i < maxWaitLoops
  ) {
    i += 1;
    await wait(waitTime);
  }

  if (connection.reconnectVerification) {
    await connection.reconnectVerification.catch(() => false);
  }

  if (requiresQRReconnectionVerification(connection)) {
    throw providerErrors.unauthorized(
      'Reconnection has not been re-authorized by the wallet user.',
    );
  }
};
