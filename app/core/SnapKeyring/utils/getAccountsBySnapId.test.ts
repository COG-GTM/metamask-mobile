import type { SnapId } from '@metamask/snaps-sdk';

const mockGetAccountsBySnapId = jest.fn();
const mockGetSnapKeyring = jest.fn();

jest.mock('../../../core/Engine', () => ({
  __esModule: true,
  default: {
    getSnapKeyring: () => mockGetSnapKeyring(),
  },
}));

import { getAccountsBySnapId } from './getAccountsBySnapId';

describe('getAccountsBySnapId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSnapKeyring.mockResolvedValue({
      getAccountsBySnapId: mockGetAccountsBySnapId,
    });
  });

  it('returns the accounts associated with the snap id', async () => {
    const snapId = 'npm:@metamask/example-snap' as SnapId;
    mockGetAccountsBySnapId.mockResolvedValue(['0xabc', '0xdef']);

    const result = await getAccountsBySnapId(snapId);

    expect(result).toEqual(['0xabc', '0xdef']);
    expect(mockGetAccountsBySnapId).toHaveBeenCalledWith(snapId);
  });

  it('propagates errors from the keyring', async () => {
    const snapId = 'npm:@metamask/example-snap' as SnapId;
    mockGetAccountsBySnapId.mockRejectedValue(new Error('kaput'));

    await expect(getAccountsBySnapId(snapId)).rejects.toThrow('kaput');
  });
});
