import {
  isEthAccount,
  getFormattedAddressFromInternalAccount,
  isNonEvmChainId,
  isBtcAccount,
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  shortenTransactionId,
  getTransactionUrl,
  getAddressUrl,
} from './utils';
import { EthAccountType, BtcAccountType, SolScope, BtcScope } from '@metamask/keyring-api';

describe('Multichain utils', () => {
  const mockEthAccount = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    type: EthAccountType.Eoa,
    id: 'test-id',
    metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
    options: {},
    methods: [],
  } as any;

  const mockErc4337Account = {
    ...mockEthAccount,
    type: EthAccountType.Erc4337,
  } as any;

  const mockBtcAccount = {
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    type: BtcAccountType.P2wpkh,
    id: 'btc-id',
    metadata: { name: 'BTC Account', keyring: { type: 'Snap Keyring' } },
    options: {},
    methods: [],
  } as any;

  describe('isEthAccount', () => {
    it('returns true for EOA account', () => {
      expect(isEthAccount(mockEthAccount)).toBe(true);
    });

    it('returns true for ERC4337 account', () => {
      expect(isEthAccount(mockErc4337Account)).toBe(true);
    });

    it('returns false for BTC account', () => {
      expect(isEthAccount(mockBtcAccount)).toBe(false);
    });

    it('returns false for null account', () => {
      expect(isEthAccount(null as any)).toBe(false);
    });
  });

  describe('getFormattedAddressFromInternalAccount', () => {
    it('returns checksummed address for ETH account', () => {
      const result = getFormattedAddressFromInternalAccount(mockEthAccount);
      expect(result).toBeDefined();
      expect(result.startsWith('0x')).toBe(true);
    });

    it('returns address as-is for non-ETH account', () => {
      const result = getFormattedAddressFromInternalAccount(mockBtcAccount);
      expect(result).toBe(mockBtcAccount.address);
    });
  });

  describe('isNonEvmChainId', () => {
    it('returns true for Solana mainnet', () => {
      expect(isNonEvmChainId(SolScope.Mainnet)).toBe(true);
    });

    it('returns true for BTC mainnet', () => {
      expect(isNonEvmChainId(BtcScope.Mainnet)).toBe(true);
    });

    it('returns false for ETH mainnet', () => {
      expect(isNonEvmChainId('0x1')).toBe(false);
    });
  });

  describe('isBtcAccount', () => {
    it('returns true for P2wpkh account', () => {
      expect(isBtcAccount(mockBtcAccount)).toBe(true);
    });

    it('returns false for ETH account', () => {
      expect(isBtcAccount(mockEthAccount)).toBe(false);
    });
  });

  describe('isBtcMainnetAddress', () => {
    it('returns true for valid mainnet address', () => {
      expect(isBtcMainnetAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
    });

    it('returns false for invalid address', () => {
      expect(isBtcMainnetAddress('invalid')).toBe(false);
    });
  });

  describe('isBtcTestnetAddress', () => {
    it('returns false for mainnet address', () => {
      expect(isBtcTestnetAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(false);
    });
  });

  describe('getTransactionUrl', () => {
    it('returns empty string for unknown chain', () => {
      expect(getTransactionUrl('txid', 'unknown:chain' as any)).toBe('');
    });
  });

  describe('getAddressUrl', () => {
    it('returns empty string for unknown chain', () => {
      expect(getAddressUrl('addr', 'unknown:chain' as any)).toBe('');
    });
  });

  describe('shortenTransactionId', () => {
    it('shortens a transaction ID', () => {
      const txId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = shortenTransactionId(txId);
      expect(result.length).toBeLessThan(txId.length);
    });
  });
});
