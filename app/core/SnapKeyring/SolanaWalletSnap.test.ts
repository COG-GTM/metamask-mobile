import { HandlerType } from '@metamask/snaps-utils';

const mockHandleSnapRequest = jest.fn();
jest.mock('../Snaps/utils', () => ({
  handleSnapRequest: (...args: unknown[]) => mockHandleSnapRequest(...args),
}));

import {
  SOLANA_WALLET_SNAP_ID,
  SOLANA_WALLET_NAME,
  SolanaWalletSnapSender,
} from './SolanaWalletSnap';

describe('SolanaWalletSnap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the snap id and name from the pre-installed snap manifest', () => {
    expect(typeof SOLANA_WALLET_SNAP_ID).toBe('string');
    expect(SOLANA_WALLET_SNAP_ID.length).toBeGreaterThan(0);
    expect(typeof SOLANA_WALLET_NAME).toBe('string');
    expect(SOLANA_WALLET_NAME.length).toBeGreaterThan(0);
  });

  describe('SolanaWalletSnapSender', () => {
    it('forwards keyring requests to the Solana snap', async () => {
      mockHandleSnapRequest.mockResolvedValue({ ok: true });
      const sender = new SolanaWalletSnapSender();

      const request = {
        id: 'req-1',
        jsonrpc: '2.0' as const,
        method: 'keyring_getAccount',
        params: ['a1'],
      };

      const result = await sender.send(request);

      expect(result).toEqual({ ok: true });
      expect(mockHandleSnapRequest).toHaveBeenCalledTimes(1);
      const [, payload] = mockHandleSnapRequest.mock.calls[0];
      expect(payload).toEqual({
        origin: 'metamask',
        snapId: SOLANA_WALLET_SNAP_ID,
        handler: HandlerType.OnKeyringRequest,
        request,
      });
    });

    it('propagates handleSnapRequest errors', async () => {
      mockHandleSnapRequest.mockRejectedValue(new Error('bad'));
      const sender = new SolanaWalletSnapSender();

      await expect(
        sender.send({
          id: '1',
          jsonrpc: '2.0' as const,
          method: 'keyring_getAccount',
          params: [],
        }),
      ).rejects.toThrow('bad');
    });
  });
});
