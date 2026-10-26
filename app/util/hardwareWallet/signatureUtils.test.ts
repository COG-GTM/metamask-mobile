import signatureUtils from './signatureUtils';
import { handleSignatureAction } from '../confirmation/signatureUtils';
import { getKeyringByAddress } from '../address';
import { signModalNavDetail } from './hardwareWallets/ledger';
import ExtendedKeyringTypes from '../../constants/keyringTypes';

jest.mock('../confirmation/signatureUtils', () => ({
  handleSignatureAction: jest.fn(),
}));

jest.mock('../address', () => ({
  getKeyringByAddress: jest.fn(),
}));

jest.mock('./hardwareWallets/ledger', () => ({
  signModalNavDetail: jest.fn(),
}));

const mockGetKeyringByAddress = getKeyringByAddress as jest.Mock;
const mockSignModalNavDetail = signModalNavDetail as jest.Mock;
const mockHandleSignatureAction = handleSignatureAction as jest.Mock;

const messageParams = { from: '0xabc', data: '0x' };

describe('hardwareWallet signatureUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when no keyring is found', async () => {
    mockGetKeyringByAddress.mockReturnValue(undefined);
    await expect(
      signatureUtils(jest.fn(), jest.fn(), messageParams, 'personal_sign'),
    ).rejects.toThrow('Keyring not found for address 0xabc');
  });

  it('throws when the keyring type is not supported', async () => {
    mockGetKeyringByAddress.mockReturnValue({
      type: ExtendedKeyringTypes.hd,
    });
    await expect(
      signatureUtils(jest.fn(), jest.fn(), messageParams, 'personal_sign'),
    ).rejects.toThrow(
      `Keyring type ${ExtendedKeyringTypes.hd} not supported for signature redirect navigation`,
    );
  });

  it('navigates to the ledger sign modal and handles confirmation', async () => {
    mockGetKeyringByAddress.mockReturnValue({
      type: ExtendedKeyringTypes.ledger,
    });
    mockSignModalNavDetail.mockResolvedValue(['route', {}]);
    const onReject = jest.fn();
    const onConfirm = jest.fn();

    const result = await signatureUtils(
      onReject,
      onConfirm,
      messageParams,
      'personal_sign',
    );

    expect(result).toEqual(['route', {}]);
    const { onConfirmationComplete, type } =
      mockSignModalNavDetail.mock.calls[0][0];
    expect(type).toBe('personal_sign');

    await onConfirmationComplete(true);
    expect(mockHandleSignatureAction).toHaveBeenLastCalledWith(
      onConfirm,
      messageParams,
      'personal_sign',
      true,
    );

    await onConfirmationComplete(false);
    expect(mockHandleSignatureAction).toHaveBeenLastCalledWith(
      onReject,
      messageParams,
      'personal_sign',
      false,
    );
  });
});
