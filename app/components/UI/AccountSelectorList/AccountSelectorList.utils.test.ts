import { KeyringTypes } from '@metamask/keyring-controller';
import { getLabelTextByAddress } from '../../../util/address';
import { Account } from '../../hooks/useAccounts';
import {
  getAccountItemHeight,
  getAccountItemOffsets,
} from './AccountSelectorList.utils';

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  getLabelTextByAddress: jest.fn(),
}));

const mockGetLabelTextByAddress = getLabelTextByAddress as jest.Mock;

const createAccount = (address: string, balanceError?: string): Account =>
  ({
    name: 'Account',
    address,
    type: KeyringTypes.hd,
    yOffset: 0,
    isSelected: false,
    balanceError,
  } as Account);

const options = { rendersBalanceError: true };

describe('AccountSelectorList utils', () => {
  beforeEach(() => {
    mockGetLabelTextByAddress.mockReset();
    mockGetLabelTextByAddress.mockReturnValue(null);
  });

  describe('getAccountItemHeight', () => {
    it('returns the base height for an account without a tag or error', () => {
      expect(getAccountItemHeight(createAccount('0x1'), options)).toBe(80);
    });

    it('adds height for the tag label rendered next to the account name', () => {
      mockGetLabelTextByAddress.mockReturnValue('SRP #2');
      expect(getAccountItemHeight(createAccount('0x1'), options)).toBe(108);
    });

    it('adds height for a balance error rendered as tertiary text', () => {
      expect(getAccountItemHeight(createAccount('0x1', 'error'), options)).toBe(
        104,
      );
    });

    it('ignores the balance error for variants that do not render it', () => {
      expect(
        getAccountItemHeight(createAccount('0x1', 'error'), {
          rendersBalanceError: false,
        }),
      ).toBe(80);
    });
  });

  describe('getAccountItemOffsets', () => {
    it('accumulates offsets of the accounts that are rendered', () => {
      mockGetLabelTextByAddress.mockImplementation((address: string) =>
        address === '0x2' ? 'Imported' : null,
      );

      expect(
        getAccountItemOffsets(
          [createAccount('0x1'), createAccount('0x2'), createAccount('0x3')],
          options,
        ),
      ).toEqual([0, 80, 188]);
    });

    it('starts at zero regardless of the account position in the unfiltered list', () => {
      const account = createAccount('0x3');
      account.yOffset = 780;

      expect(getAccountItemOffsets([account], options)).toEqual([0]);
    });
  });
});
