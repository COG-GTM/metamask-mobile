import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';

const mockHandleSnapRequest = jest.fn();

jest.mock('../../Snaps/utils', () => ({
  handleSnapRequest: (...args: unknown[]) => mockHandleSnapRequest(...args),
}));

import { sendMultichainTransaction } from './sendMultichainTransaction';

describe('sendMultichainTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches a startSendTransactionFlow request to the snap', async () => {
    const snapId = 'npm:@metamask/solana-wallet-snap' as SnapId;

    await sendMultichainTransaction(snapId, {
      account: 'account-1',
      scope: 'solana:mainnet',
    });

    expect(mockHandleSnapRequest).toHaveBeenCalledTimes(1);
    const [, payload] = mockHandleSnapRequest.mock.calls[0];
    expect(payload).toEqual({
      snapId,
      origin: 'metamask',
      handler: HandlerType.OnRpcRequest,
      request: {
        method: 'startSendTransactionFlow',
        params: {
          account: 'account-1',
          scope: 'solana:mainnet',
        },
      },
    });
  });

  it('surfaces handleSnapRequest errors to callers', async () => {
    const snapId = 'npm:@metamask/solana-wallet-snap' as SnapId;
    mockHandleSnapRequest.mockRejectedValueOnce(new Error('fail'));

    await expect(
      sendMultichainTransaction(snapId, {
        account: 'a',
        scope: 's',
      }),
    ).rejects.toThrow('fail');
  });
});
