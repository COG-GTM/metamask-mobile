import ExtendedKeyringTypes from '../../constants/keyringTypes';
import { getKeyringByAddress } from '../address';
import { handleSignatureAction } from '../confirmation/signatureUtils';
import { signModalNavDetail } from './hardwareWallets/ledger';
import hardwareSignatureUtils from './signatureUtils';

jest.mock('../address', () => ({
  getKeyringByAddress: jest.fn(),
}));

jest.mock('../confirmation/signatureUtils', () => ({
  handleSignatureAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./hardwareWallets/ledger', () => ({
  signModalNavDetail: jest.fn().mockResolvedValue(['nav', { foo: 'bar' }]),
}));

describe('hardwareWallet/signatureUtils', () => {
  beforeEach(() => {
    (handleSignatureAction as jest.Mock).mockClear();
    (signModalNavDetail as jest.Mock).mockClear();
  });

  it('throws when no keyring is found for the from address', async () => {
    (getKeyringByAddress as jest.Mock).mockReturnValue(undefined);
    await expect(
      hardwareSignatureUtils(
        jest.fn(),
        jest.fn(),
        { from: '0xabc' },
        'V4',
      ),
    ).rejects.toThrow('Keyring not found for address 0xabc');
  });

  it('throws when the keyring type has no registered nav handler', async () => {
    (getKeyringByAddress as jest.Mock).mockReturnValue({
      type: 'Unsupported Keyring',
    });
    await expect(
      hardwareSignatureUtils(jest.fn(), jest.fn(), { from: '0x1' }, 'V4'),
    ).rejects.toThrow(/not supported for signature redirect navigation/);
  });

  it('dispatches to the ledger nav handler and wires callbacks', async () => {
    (getKeyringByAddress as jest.Mock).mockReturnValue({
      type: ExtendedKeyringTypes.ledger,
    });
    const onReject = jest.fn();
    const onConfirm = jest.fn();

    const result = await hardwareSignatureUtils(
      onReject,
      onConfirm,
      { from: '0x1' },
      'V4',
    );

    expect(signModalNavDetail).toHaveBeenCalledTimes(1);
    const call = (signModalNavDetail as jest.Mock).mock.calls[0][0];
    expect(call.type).toBe('V4');

    await call.onConfirmationComplete(true);
    await call.onConfirmationComplete(false);
    expect(handleSignatureAction).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['nav', { foo: 'bar' }]);
  });
});
