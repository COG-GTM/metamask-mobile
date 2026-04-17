// Test that types are properly exported and usable
import type {
  EncryptionLibrary,
  EncryptionResult,
  EncryptionKey,
  GenericEncryptor,
  KeyDerivationOptions,
} from './types';

describe('Encryptor types', () => {
  it('EncryptionResult interface has correct shape', () => {
    const result: EncryptionResult = {
      cipher: 'encrypted-data',
      iv: 'initialization-vector',
    };
    expect(result.cipher).toBe('encrypted-data');
    expect(result.iv).toBe('initialization-vector');
    expect(result.salt).toBeUndefined();
    expect(result.lib).toBeUndefined();
  });

  it('EncryptionResult with optional fields', () => {
    const result: EncryptionResult = {
      cipher: 'data',
      iv: 'iv',
      salt: 'salt-value',
      lib: 'quick-crypto',
    };
    expect(result.salt).toBe('salt-value');
    expect(result.lib).toBe('quick-crypto');
  });

  it('EncryptionKey interface has correct shape', () => {
    const key: EncryptionKey = {
      key: 'key-value',
      lib: 'quick-crypto',
      exportable: true,
      keyMetadata: { algorithm: 'PBKDF2', params: { iterations: 600000 } } as unknown as KeyDerivationOptions,
    };
    expect(key.key).toBe('key-value');
    expect(key.lib).toBe('quick-crypto');
    expect(key.exportable).toBe(true);
    expect(key.keyMetadata).toBeDefined();
  });

  it('GenericEncryptor interface type check', () => {
    const mockEncryptor: GenericEncryptor = {
      encrypt: async (_password: string, _data: any) => 'encrypted',
      decrypt: async (_password: string, _text: string) => ({ data: 'decrypted' }),
    };
    expect(mockEncryptor.encrypt).toBeDefined();
    expect(mockEncryptor.decrypt).toBeDefined();
    expect(mockEncryptor.isVaultUpdated).toBeUndefined();
  });

  it('GenericEncryptor with isVaultUpdated', () => {
    const mockEncryptor: GenericEncryptor = {
      encrypt: async () => 'encrypted',
      decrypt: async () => ({}),
      isVaultUpdated: (_vault: string) => true,
    };
    expect(mockEncryptor.isVaultUpdated).toBeDefined();
    expect(mockEncryptor.isVaultUpdated!('vault')).toBe(true);
  });
});
