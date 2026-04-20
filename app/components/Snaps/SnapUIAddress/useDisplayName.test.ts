import { renderHook } from '@testing-library/react-hooks';
import { useDisplayName } from './useDisplayName';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    mockUseSelector(selector),
}));

jest.mock('../../../selectors/accountsController', () => ({
  selectInternalAccounts: jest.fn(),
}));
jest.mock('../../../selectors/addressBookController', () => ({
  selectAddressBookByChain: jest.fn(() => []),
}));

import { selectInternalAccounts } from '../../../selectors/accountsController';
import { selectAddressBookByChain } from '../../../selectors/addressBookController';

describe('useDisplayName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = ({
    accounts = [] as { address: string; metadata?: { name?: string } }[],
    addressBook = [] as { address: string; name?: string }[],
  }) => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectInternalAccounts) {
        return accounts;
      }
      if (typeof selector === 'function') {
        (selectAddressBookByChain as unknown as jest.Mock).mockReturnValue(
          addressBook,
        );
        return addressBook;
      }
      return undefined;
    });
  };

  it('returns the account metadata name when there is a match', () => {
    setup({
      accounts: [
        {
          address: '0xABC',
          metadata: { name: 'My Wallet' },
        },
      ],
    });

    const { result } = renderHook(() =>
      useDisplayName({
        chain: { namespace: 'eip155', reference: '1' },
        chainId: 'eip155:1',
        address: '0xabc',
      }),
    );

    expect(result.current).toBe('My Wallet');
  });

  it('falls back to address book entry for eip155 namespaces', () => {
    setup({
      accounts: [],
      addressBook: [{ address: '0xabc', name: 'Vitalik' }],
    });

    const { result } = renderHook(() =>
      useDisplayName({
        chain: { namespace: 'eip155', reference: '1' },
        chainId: 'eip155:1',
        address: '0xabc',
      }),
    );

    expect(result.current).toBe('Vitalik');
  });

  it('returns undefined when there is no match', () => {
    setup({});

    const { result } = renderHook(() =>
      useDisplayName({
        chain: { namespace: 'eip155', reference: '1' },
        chainId: 'eip155:1',
        address: '0xdead',
      }),
    );

    expect(result.current).toBeUndefined();
  });

  it('does not fall back to the address book for non-eip155 namespaces', () => {
    setup({
      accounts: [],
      addressBook: [{ address: 'abcd', name: 'Should be ignored' }],
    });

    const { result } = renderHook(() =>
      useDisplayName({
        chain: { namespace: 'solana', reference: '5eykt4' },
        chainId: 'solana:5eykt4',
        address: 'abcd',
      }),
    );

    expect(result.current).toBeUndefined();
  });
});
