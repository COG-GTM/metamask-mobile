import {
  SALT_BYTES_COUNT,
  SHA256_DIGEST_LENGTH,
  KeyDerivationIteration,
  ENCRYPTION_LIBRARY,
  KDF_ALGORITHM,
  LEGACY_DERIVATION_OPTIONS,
  DERIVATION_OPTIONS_MINIMUM_OWASP2023,
  DERIVATION_OPTIONS_DEFAULT_OWASP2023,
} from './constants';

describe('Encryptor constants', () => {
  it('SALT_BYTES_COUNT is 32', () => {
    expect(SALT_BYTES_COUNT).toBe(32);
  });

  it('SHA256_DIGEST_LENGTH is 256', () => {
    expect(SHA256_DIGEST_LENGTH).toBe(256);
  });

  it('KeyDerivationIteration has correct values', () => {
    expect(KeyDerivationIteration.Legacy5000).toBe(5000);
    expect(KeyDerivationIteration.OWASP2023Minimum).toBe(600000);
    expect(KeyDerivationIteration.OWASP2023Default).toBe(900000);
  });

  it('ENCRYPTION_LIBRARY has correct keys', () => {
    expect(ENCRYPTION_LIBRARY.original).toBe('original');
    expect(ENCRYPTION_LIBRARY.forked).toBe('forked');
    expect(ENCRYPTION_LIBRARY.quickCrypto).toBe('quick-crypto');
  });

  it('KDF_ALGORITHM is PBKDF2', () => {
    expect(KDF_ALGORITHM).toBe('PBKDF2');
  });

  it('LEGACY_DERIVATION_OPTIONS uses legacy iterations', () => {
    expect(LEGACY_DERIVATION_OPTIONS.algorithm).toBe('PBKDF2');
    expect(LEGACY_DERIVATION_OPTIONS.params.iterations).toBe(5000);
  });

  it('DERIVATION_OPTIONS_MINIMUM_OWASP2023 uses minimum iterations', () => {
    expect(DERIVATION_OPTIONS_MINIMUM_OWASP2023.algorithm).toBe('PBKDF2');
    expect(DERIVATION_OPTIONS_MINIMUM_OWASP2023.params.iterations).toBe(600000);
  });

  it('DERIVATION_OPTIONS_DEFAULT_OWASP2023 uses default iterations', () => {
    expect(DERIVATION_OPTIONS_DEFAULT_OWASP2023.algorithm).toBe('PBKDF2');
    expect(DERIVATION_OPTIONS_DEFAULT_OWASP2023.params.iterations).toBe(900000);
  });
});
