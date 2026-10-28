import AppConstants from '../../AppConstants';
import { Connection } from '../Connection';
import { wait } from '../utils/wait.util';
import {
  assertQRReconnectionVerified,
  requiresQRReconnectionVerification,
} from './verifyQRReconnection';

jest.mock('../../Engine');
jest.mock('../utils/DevLogger');
jest.mock('../utils/wait.util');

describe('verifyQRReconnection', () => {
  let connection: Connection;

  beforeEach(() => {
    jest.resetAllMocks();
    connection = {
      channelId: 'channel-1',
      origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
      initialConnection: false,
      reconnectVerified: false,
      remote: { hasRelayPersistence: () => false },
    } as unknown as Connection;
  });

  describe('requiresQRReconnectionVerification', () => {
    it('is required for an unverified QR code reconnection', () => {
      expect(requiresQRReconnectionVerification(connection)).toBe(true);
    });

    it('is not required once the reconnection is verified', () => {
      connection.reconnectVerified = true;
      expect(requiresQRReconnectionVerification(connection)).toBe(false);
    });

    it('is not required for the initial QR code connection', () => {
      connection.initialConnection = true;
      expect(requiresQRReconnectionVerification(connection)).toBe(false);
    });

    it('is not required for deeplink connections', () => {
      connection.origin = AppConstants.DEEPLINKS.ORIGIN_DEEPLINK;
      expect(requiresQRReconnectionVerification(connection)).toBe(false);
    });

    it('is not required for relay-persisted connections', () => {
      connection.remote = {
        hasRelayPersistence: () => true,
      } as unknown as Connection['remote'];
      expect(requiresQRReconnectionVerification(connection)).toBe(false);
    });
  });

  describe('assertQRReconnectionVerified', () => {
    it('waits for the verification to start when a request arrives before clients_ready', async () => {
      let calls = 0;
      (wait as jest.Mock).mockImplementation(async () => {
        calls += 1;
        if (calls === 2) {
          connection.reconnectVerification = Promise.resolve(true).then(() => {
            connection.reconnectVerified = true;
            return true;
          });
        }
      });

      await expect(
        assertQRReconnectionVerified(connection),
      ).resolves.toBeUndefined();
      expect(wait).toHaveBeenCalledTimes(2);
    });

    it('rejects requests when the verification never starts', async () => {
      (wait as jest.Mock).mockResolvedValue(undefined);

      await expect(
        assertQRReconnectionVerified(connection, { maxWaitLoops: 3 }),
      ).rejects.toThrow(
        'Reconnection has not been re-authorized by the wallet user.',
      );
      expect(wait).toHaveBeenCalledTimes(3);
    });

    it('rejects requests after the verification resolved as not verified', async () => {
      connection.reconnectVerification = Promise.resolve(false);
      await expect(assertQRReconnectionVerified(connection)).rejects.toThrow(
        'Reconnection has not been re-authorized by the wallet user.',
      );
    });

    it('waits for a pending verification and passes when it succeeds', async () => {
      connection.reconnectVerification = Promise.resolve(true).then(() => {
        connection.reconnectVerified = true;
        return true;
      });
      await expect(
        assertQRReconnectionVerified(connection),
      ).resolves.toBeUndefined();
    });

    it('waits for a pending verification and rejects when it fails', async () => {
      connection.reconnectVerification = Promise.reject(new Error('rejected'));
      await expect(assertQRReconnectionVerified(connection)).rejects.toThrow(
        'Reconnection has not been re-authorized by the wallet user.',
      );
    });

    it('passes for verified connections', async () => {
      connection.reconnectVerified = true;
      await expect(
        assertQRReconnectionVerified(connection),
      ).resolves.toBeUndefined();
    });
  });
});
