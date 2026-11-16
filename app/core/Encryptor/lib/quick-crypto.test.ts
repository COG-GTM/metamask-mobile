import Crypto from 'react-native-quick-crypto';
import {
  QuickCryptoLib,
  CipherAlgorithmQuickCrypto,
  HashAlgorithmQuickCrypto,
} from './quick-crypto';
import { KDF_ALGORITHM, LEGACY_DERIVATION_OPTIONS } from '../constants';

// Back `react-native-quick-crypto` with Node's WebCrypto (wrapped in spies) so
// the real PBKDF2 / AES-CBC primitives run instead of the global random mock.
// quick-crypto converts string salts with utf-8, which Node's WebCrypto does not.
jest.mock('react-native-quick-crypto', () => {
  const { webcrypto } = jest.requireActual('crypto');
  const toBuffer = (value: unknown) =>
    typeof value === 'string' ? Buffer.from(value, 'utf-8') : value;
  return {
    getRandomValues: jest.fn((array: Uint8Array) =>
      webcrypto.getRandomValues(array),
    ),
    subtle: {
      importKey: jest.fn((...args: unknown[]) =>
        webcrypto.subtle.importKey(...args),
      ),
      deriveBits: jest.fn(
        (algorithm: { salt: unknown }, baseKey: unknown, length: number) =>
          webcrypto.subtle.deriveBits(
            { ...algorithm, salt: toBuffer(algorithm.salt) },
            baseKey,
            length,
          ),
      ),
      exportKey: jest.fn((...args: unknown[]) =>
        webcrypto.subtle.exportKey(...args),
      ),
      encrypt: jest.fn((...args: unknown[]) =>
        webcrypto.subtle.encrypt(...args),
      ),
      decrypt: jest.fn((...args: unknown[]) =>
        webcrypto.subtle.decrypt(...args),
      ),
    },
  };
});

const mockSubtle = Crypto.subtle as unknown as Record<string, jest.Mock>;
const mockGetRandomValues = Crypto.getRandomValues as unknown as jest.Mock;

// Known-answer vectors computed independently (Python hashlib / OpenSSL CLI):
//   hashlib.pbkdf2_hmac('sha512', PASSWORD, SALT, 5000, 32)
//   openssl enc -aes-256-cbc -K <KEY hex> -iv <IV> -base64 -A
const PASSWORD = 'correct horse battery staple';
const SALT = '0123456789abcdef0123456789abcdef';
const KEY_B64 = 'yMjyN/sEfuhSTa6IvswIC/zPX5TPa6BeUVVi+jrSPGE=';
const IV_HEX = '000102030405060708090a0b0c0d0e0f';
const PLAINTEXT =
  '{"mnemonic":"test test test test test test test test test test test junk"}';
const CIPHERTEXT_B64 =
  '3pPk+BMumn0H0hy4kP8vvgusjkOVv5YFib7crQFDoc7SAUYw2yhGV8F9BvDoMFu3Q9xk5ekjlFmmPcXsUVb6CR6JmMie4EvXc5RHbOnmeCs=';
const UNICODE_PLAINTEXT = 'héllo wörld';
const UNICODE_CIPHERTEXT_B64 = 'c7IDFazACSv9N5pH0SrOWg==';

describe('QuickCryptoLib', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateIv', () => {
    it('returns `size` random bytes as an unprefixed lowercase hex string', async () => {
      mockGetRandomValues.mockImplementationOnce((array: Uint8Array) => {
        array.set(Array.from({ length: array.length }, (_, i) => i));
        return array;
      });

      const iv = await QuickCryptoLib.generateIv(16);

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(mockGetRandomValues.mock.calls[0][0]).toHaveLength(16);
      expect(iv).toBe(IV_HEX);
    });

    it('returns 32 hex chars without a 0x prefix for a 16-byte IV', async () => {
      const iv = await QuickCryptoLib.generateIv(16);

      expect(iv).toMatch(/^[0-9a-f]{32}$/u);
      expect(iv.startsWith('0x')).toBe(false);
    });

    it('returns a different IV on each call', async () => {
      const first = await QuickCryptoLib.generateIv(16);
      const second = await QuickCryptoLib.generateIv(16);

      expect(first).not.toBe(second);
    });
  });

  describe('deriveKey', () => {
    it('derives the known PBKDF2-SHA512 256-bit key as base64', async () => {
      const key = await QuickCryptoLib.deriveKey(
        PASSWORD,
        SALT,
        LEGACY_DERIVATION_OPTIONS,
      );

      expect(key).toBe(KEY_B64);
      expect(Buffer.from(key, 'base64')).toHaveLength(32);
    });

    it('passes the PBKDF2 / SHA-512 / 256-bit parameters to Crypto.subtle', async () => {
      await QuickCryptoLib.deriveKey(PASSWORD, SALT, LEGACY_DERIVATION_OPTIONS);

      expect(mockSubtle.importKey).toHaveBeenCalledTimes(1);
      const [format, passBuffer, algorithm, extractable, usages] =
        mockSubtle.importKey.mock.calls[0];
      expect(format).toBe('raw');
      expect(Buffer.from(passBuffer).toString('utf-8')).toBe(PASSWORD);
      expect(algorithm).toStrictEqual({ name: KDF_ALGORITHM });
      expect(extractable).toBe(false);
      expect(usages).toStrictEqual(['deriveBits', 'deriveKey']);

      expect(mockSubtle.deriveBits).toHaveBeenCalledTimes(1);
      const [params, baseKey, length] = mockSubtle.deriveBits.mock.calls[0];
      expect(params).toStrictEqual({
        name: 'PBKDF2',
        salt: SALT,
        iterations: LEGACY_DERIVATION_OPTIONS.params.iterations,
        hash: 'SHA-512',
      });
      expect(HashAlgorithmQuickCrypto.Sha512).toBe('SHA-512');
      expect(baseKey).toBe(await mockSubtle.importKey.mock.results[0].value);
      expect(length).toBe(256);
    });

    it('produces a different key for a different password, salt or iteration count', async () => {
      const otherPassword = await QuickCryptoLib.deriveKey(
        `${PASSWORD}!`,
        SALT,
        LEGACY_DERIVATION_OPTIONS,
      );
      const otherSalt = await QuickCryptoLib.deriveKey(
        PASSWORD,
        `${SALT}00`,
        LEGACY_DERIVATION_OPTIONS,
      );
      const otherIterations = await QuickCryptoLib.deriveKey(PASSWORD, SALT, {
        ...LEGACY_DERIVATION_OPTIONS,
        params: { iterations: 5001 },
      });

      expect(otherPassword).not.toBe(KEY_B64);
      expect(otherSalt).not.toBe(KEY_B64);
      expect(otherIterations).not.toBe(KEY_B64);
    });
  });

  describe('importKey', () => {
    it('imports the base64 key as a raw, extractable AES-CBC-256 key', async () => {
      await QuickCryptoLib.importKey(KEY_B64);

      expect(mockSubtle.importKey).toHaveBeenCalledTimes(1);
      const [format, keyBuffer, algorithm, extractable, usages] =
        mockSubtle.importKey.mock.calls[0];
      expect(format).toBe('raw');
      expect(Buffer.from(keyBuffer).toString('base64')).toBe(KEY_B64);
      expect(algorithm).toStrictEqual({ name: 'AES-CBC', length: 256 });
      expect(CipherAlgorithmQuickCrypto.Cbc).toBe('AES-CBC');
      expect(extractable).toBe(true);
      expect(usages).toStrictEqual(['encrypt', 'decrypt']);
    });

    it('round-trips through exportKey as the same base64 key', async () => {
      const cryptoKey = await QuickCryptoLib.importKey(KEY_B64);

      expect(await QuickCryptoLib.exportKey('raw', cryptoKey)).toBe(KEY_B64);
    });
  });

  describe('encrypt', () => {
    it('encrypts utf-8 data with a base64 key and hex IV to the known base64 ciphertext', async () => {
      expect(await QuickCryptoLib.encrypt(PLAINTEXT, KEY_B64, IV_HEX)).toBe(
        CIPHERTEXT_B64,
      );
      expect(
        await QuickCryptoLib.encrypt(UNICODE_PLAINTEXT, KEY_B64, IV_HEX),
      ).toBe(UNICODE_CIPHERTEXT_B64);
    });

    it('passes AES-CBC with the hex-decoded IV and utf-8 data to Crypto.subtle.encrypt', async () => {
      await QuickCryptoLib.encrypt(PLAINTEXT, KEY_B64, IV_HEX);

      expect(mockSubtle.encrypt).toHaveBeenCalledTimes(1);
      const [algorithm, cryptoKey, data] = mockSubtle.encrypt.mock.calls[0];
      expect(algorithm.name).toBe('AES-CBC');
      expect(Buffer.from(algorithm.iv).toString('hex')).toBe(IV_HEX);
      expect(algorithm.iv).toHaveLength(16);
      expect(cryptoKey).toBe(await mockSubtle.importKey.mock.results[0].value);
      expect(Buffer.from(data).toString('utf-8')).toBe(PLAINTEXT);
    });
  });

  describe('decrypt', () => {
    it('decrypts the known base64 ciphertext with a hex IV back to utf-8', async () => {
      expect(
        await QuickCryptoLib.decrypt(CIPHERTEXT_B64, KEY_B64, IV_HEX),
      ).toBe(PLAINTEXT);
      expect(
        await QuickCryptoLib.decrypt(UNICODE_CIPHERTEXT_B64, KEY_B64, IV_HEX),
      ).toBe(UNICODE_PLAINTEXT);
    });

    it('passes AES-CBC with the hex-decoded IV and base64-decoded data to Crypto.subtle.decrypt', async () => {
      await QuickCryptoLib.decrypt(CIPHERTEXT_B64, KEY_B64, IV_HEX);

      expect(mockSubtle.decrypt).toHaveBeenCalledTimes(1);
      const [algorithm, cryptoKey, data] = mockSubtle.decrypt.mock.calls[0];
      expect(algorithm.name).toBe('AES-CBC');
      expect(Buffer.from(algorithm.iv).toString('hex')).toBe(IV_HEX);
      expect(cryptoKey).toBe(await mockSubtle.importKey.mock.results[0].value);
      expect(Buffer.from(data).toString('base64')).toBe(CIPHERTEXT_B64);
    });

    it('round-trips encrypt -> decrypt with a derived key and generated IV', async () => {
      const key = await QuickCryptoLib.deriveKey(
        PASSWORD,
        SALT,
        LEGACY_DERIVATION_OPTIONS,
      );
      const iv = await QuickCryptoLib.generateIv(16);

      const cipher = await QuickCryptoLib.encrypt(PLAINTEXT, key, iv);

      expect(await QuickCryptoLib.decrypt(cipher, key, iv)).toBe(PLAINTEXT);
    });

    it('rejects when decrypting with the wrong key', async () => {
      const wrongKey = await QuickCryptoLib.deriveKey(
        'wrong password',
        SALT,
        LEGACY_DERIVATION_OPTIONS,
      );

      await expect(
        QuickCryptoLib.decrypt(CIPHERTEXT_B64, wrongKey, IV_HEX),
      ).rejects.toThrow();
    });

    it('does not recover the plaintext with the wrong IV', async () => {
      const wrongIv = 'ff'.repeat(16);

      await expect(
        QuickCryptoLib.decrypt(CIPHERTEXT_B64, KEY_B64, wrongIv),
      ).resolves.not.toBe(PLAINTEXT);
    });
  });
});
