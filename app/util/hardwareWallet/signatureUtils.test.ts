jest.mock('../confirmation/signatureUtils', () => ({
  handleSignatureAction: jest.fn(),
}));

jest.mock('../address', () => ({
  getKeyringByAddress: jest.fn(),
}));

jest.mock('./hardwareWallets/ledger', () => ({
  signModalNavDetail: jest.fn(),
}));

jest.mock('../../constants/keyringTypes', () => ({
  __esModule: true,
  default: {
    ledger: 'Ledger Hardware',
  },
}));

import signatureHandler from './signatureUtils';
import { getKeyringByAddress } from '../address';

describe('hardwareWallet/signatureUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if keyring not found', async () => {
    (getKeyringByAddress as jest.Mock).mockReturnValue(undefined);

    await expect(
      signatureHandler(jest.fn(), jest.fn(), { from: '0x123' }, 'personal_sign'),
    ).rejects.toThrow('Keyring not found');
  });

  it('should throw if keyring type not supported', async () => {
    (getKeyringByAddress as jest.Mock).mockReturnValue({ type: 'Unknown Type' });

    await expect(
      signatureHandler(jest.fn(), jest.fn(), { from: '0x123' }, 'personal_sign'),
    ).rejects.toThrow('not supported');
  });
});
