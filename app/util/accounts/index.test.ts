import { getAccountNameWithENS } from './';

jest.mock('../address', () => ({
  safeToChecksumAddress: jest.fn((addr: string) => addr?.toLowerCase()),
}));

jest.mock('../ENSUtils', () => ({
  isDefaultAccountName: jest.fn((name: string) => {
    // Simulate default account names like "Account 1", "Account 2"
    return /^Account \d+$/.test(name);
  }),
}));

describe('getAccountNameWithENS', () => {
  const mockAccounts = [
    { address: '0xabc', name: 'Account 1', isSelected: true, balanceError: null, type: 'HD Key Tree' as const },
    { address: '0xdef', name: 'My Custom Name', isSelected: false, balanceError: null, type: 'HD Key Tree' as const },
  ];

  const mockEnsByAccountAddress = {
    '0xabc': 'user.eth',
  };

  it('should return ENS name when account has a default name and ENS exists', () => {
    const result = getAccountNameWithENS({
      accountAddress: '0xabc',
      accounts: mockAccounts as any,
      ensByAccountAddress: mockEnsByAccountAddress,
    });
    expect(result).toBe('user.eth');
  });

  it('should return custom name when account has a non-default name', () => {
    const result = getAccountNameWithENS({
      accountAddress: '0xdef',
      accounts: mockAccounts as any,
      ensByAccountAddress: {},
    });
    expect(result).toBe('My Custom Name');
  });

  it('should return custom name even if ENS exists when name is not default', () => {
    const result = getAccountNameWithENS({
      accountAddress: '0xdef',
      accounts: mockAccounts as any,
      ensByAccountAddress: { '0xdef': 'custom.eth' },
    });
    expect(result).toBe('My Custom Name');
  });

  it('should return empty string when account is not found', () => {
    const result = getAccountNameWithENS({
      accountAddress: '0xnotfound',
      accounts: mockAccounts as any,
      ensByAccountAddress: {},
    });
    expect(result).toBe('');
  });

  it('should return default account name when no ENS exists', () => {
    const result = getAccountNameWithENS({
      accountAddress: '0xabc',
      accounts: mockAccounts as any,
      ensByAccountAddress: {},
    });
    expect(result).toBe('Account 1');
  });
});
