import { HandlerType } from '@metamask/snaps-utils';

const mockHandleSnapRequest = jest.fn();
jest.mock('../Snaps/utils', () => ({
  handleSnapRequest: (...args: unknown[]) => mockHandleSnapRequest(...args),
}));

import {
  BITCOIN_WALLET_SNAP_ID,
  BITCOIN_WALLET_NAME,
  BitcoinWalletSnapSender,
} from './BitcoinWalletSnap';

describe('BitcoinWalletSnap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the snap id and name from the pre-installed snap manifest', () => {
    expect(typeof BITCOIN_WALLET_SNAP_ID).toBe('string');
    expect(BITCOIN_WALLET_SNAP_ID.length).toBeGreaterThan(0);
    expect(typeof BITCOIN_WALLET_NAME).toBe('string');
    expect(BITCOIN_WALLET_NAME.length).toBeGreaterThan(0);
  });

  describe('BitcoinWalletSnapSender', () => {
    it('forwards JSON-RPC requests to the Bitcoin wallet snap via handleSnapRequest', async () => {
      mockHandleSnapRequest.mockResolvedValue({ ok: true });
      const sender = new BitcoinWalletSnapSender();

      const request = {
        id: 'req-1',
        jsonrpc: '2.0' as const,
        method: 'keyring_listAccounts',
        params: [],
      };

      const result = await sender.send(request);

      expect(result).toEqual({ ok: true });
      expect(mockHandleSnapRequest).toHaveBeenCalledTimes(1);
      const [, payload] = mockHandleSnapRequest.mock.calls[0];
      expect(payload).toEqual({
        origin: 'metamask',
        snapId: BITCOIN_WALLET_SNAP_ID,
        handler: HandlerType.OnKeyringRequest,
        request,
      });
    });

    it('propagates errors from handleSnapRequest', async () => {
      mockHandleSnapRequest.mockRejectedValue(new Error('nope'));
      const sender = new BitcoinWalletSnapSender();

      await expect(
        sender.send({
          id: '1',
          jsonrpc: '2.0' as const,
          method: 'keyring_listAccounts',
          params: [],
        }),
      ).rejects.toThrow('nope');
    });
  });
});
