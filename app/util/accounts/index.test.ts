import { getAccountNameWithENS } from './index';

describe('accounts utils', () => {
  describe('getAccountNameWithENS', () => {
    const mockAccounts = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Account 1' },
      { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', name: 'My Custom Wallet' },
    ];

    it('returns ENS name when account has default name', () => {
      const result = getAccountNameWithENS({
        accountAddress: '0x1234567890abcdef1234567890abcdef12345678',
        accounts: mockAccounts as any,
        ensByAccountAddress: {
          '0x1234567890abcdef1234567890abcdef12345678': 'test.eth',
        },
      });
      expect(result).toBe('test.eth');
    });

    it('returns custom name over ENS name', () => {
      const result = getAccountNameWithENS({
        accountAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        accounts: mockAccounts as any,
        ensByAccountAddress: {
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': 'custom.eth',
        },
      });
      expect(result).toBe('My Custom Wallet');
    });

    it('returns account name when no ENS', () => {
      const result = getAccountNameWithENS({
        accountAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        accounts: mockAccounts as any,
        ensByAccountAddress: {},
      });
      expect(result).toBe('My Custom Wallet');
    });

    it('returns empty string when account not found', () => {
      const result = getAccountNameWithENS({
        accountAddress: '0x0000000000000000000000000000000000000000',
        accounts: mockAccounts as any,
        ensByAccountAddress: {},
      });
      expect(result).toBe('');
    });
  });
});
