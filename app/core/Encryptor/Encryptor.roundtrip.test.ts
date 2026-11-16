// eslint-disable-next-line import/no-nodejs-modules
import { pbkdf2Sync } from 'crypto';
import { Encryptor } from './Encryptor';
import { AesForkedLib, AesLib, QuickCryptoLib } from './lib';
import {
  DERIVATION_OPTIONS_MINIMUM_OWASP2023,
  ENCRYPTION_LIBRARY,
  KDF_ALGORITHM,
  LEGACY_DERIVATION_OPTIONS,
} from './constants';
import type { KeyDerivationOptions } from './types';

// The global mock in app/util/test/testSetup.js returns random derived bits and
// canned ciphertexts, so nothing encrypted there can be decrypted. Back
// react-native-quick-crypto with Node's WebCrypto to exercise the real
// PBKDF2 + AES-CBC round-trip. react-native-quick-crypto converts string salts
// to bytes as UTF-8 (binaryLikeToArrayBuffer), mirrored here.
jest.mock('react-native-quick-crypto', () => {
  const { webcrypto } = jest.requireActual('crypto');
  const toBytes = (salt: unknown) =>
    typeof salt === 'string' ? Buffer.from(salt, 'utf-8') : salt;
  return {
    getRandomValues: (array: Uint8Array) => webcrypto.getRandomValues(array),
    subtle: {
      importKey: (...args: unknown[]) => webcrypto.subtle.importKey(...args),
      deriveBits: (
        algorithm: { salt: unknown },
        baseKey: unknown,
        length: number,
      ) =>
        webcrypto.subtle.deriveBits(
          { ...algorithm, salt: toBytes(algorithm.salt) },
          baseKey,
          length,
        ),
      encrypt: (...args: unknown[]) => webcrypto.subtle.encrypt(...args),
      decrypt: (...args: unknown[]) => webcrypto.subtle.decrypt(...args),
      exportKey: (...args: unknown[]) => webcrypto.subtle.exportKey(...args),
    },
  };
});

const PASSWORD = 'correct horse battery staple';
const WRONG_PASSWORD = 'correct horse battery stapler';
const VAULT_DATA = [
  {
    type: 'HD Key Tree',
    data: {
      mnemonic: 'test test test test test test test test test test test junk',
      numberOfAccounts: 1,
      hdPath: "m/44'/60'/0'/0",
    },
  },
  { type: 'Simple Key Pair', data: ['0xabc'] },
];

const DERIVATION_CASES: [string, KeyDerivationOptions][] = [
  ['legacy (5,000 iterations)', LEGACY_DERIVATION_OPTIONS],
  [
    'OWASP 2023 minimum (600,000 iterations)',
    DERIVATION_OPTIONS_MINIMUM_OWASP2023,
  ],
];

const tamperCipher = (vault: string): string => {
  const payload = JSON.parse(vault);
  const bytes = Buffer.from(payload.cipher, 'base64');
  // Flip a bit in the first ciphertext block: in CBC this garbles the first
  // plaintext block (the JSON prefix) while keeping the padding valid.
  bytes[0] ^= 0x01;
  return JSON.stringify({ ...payload, cipher: bytes.toString('base64') });
};

describe('Encryptor (real WebCrypto)', () => {
  let encryptor: Encryptor;

  beforeEach(() => {
    encryptor = new Encryptor({
      keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('QuickCryptoLib.deriveKey', () => {
    it('matches an independent PBKDF2-SHA512 (UTF-8 salt, 256-bit) computation', async () => {
      const salt = encryptor.generateSalt(16);

      const derivedKey = await QuickCryptoLib.deriveKey(
        PASSWORD,
        salt,
        LEGACY_DERIVATION_OPTIONS,
      );

      const expected = pbkdf2Sync(
        Buffer.from(PASSWORD, 'utf-8'),
        Buffer.from(salt, 'utf-8'),
        LEGACY_DERIVATION_OPTIONS.params.iterations,
        32,
        'sha512',
      ).toString('base64');
      expect(derivedKey).toBe(expected);
    });

    it('derives different keys for different passwords, salts and iteration counts', async () => {
      const salt = encryptor.generateSalt(16);
      const base = await QuickCryptoLib.deriveKey(
        PASSWORD,
        salt,
        LEGACY_DERIVATION_OPTIONS,
      );

      await expect(
        QuickCryptoLib.deriveKey(PASSWORD, salt, LEGACY_DERIVATION_OPTIONS),
      ).resolves.toBe(base);
      await expect(
        QuickCryptoLib.deriveKey(
          WRONG_PASSWORD,
          salt,
          LEGACY_DERIVATION_OPTIONS,
        ),
      ).resolves.not.toBe(base);
      await expect(
        QuickCryptoLib.deriveKey(
          PASSWORD,
          encryptor.generateSalt(16),
          LEGACY_DERIVATION_OPTIONS,
        ),
      ).resolves.not.toBe(base);
      await expect(
        QuickCryptoLib.deriveKey(PASSWORD, salt, {
          algorithm: KDF_ALGORITHM,
          params: { iterations: 5_001 },
        }),
      ).resolves.not.toBe(base);
    });
  });

  describe('encrypt -> decrypt', () => {
    it.each(DERIVATION_CASES)(
      'round-trips the vault with %s derivation options',
      async (_, keyDerivationOptions) => {
        encryptor = new Encryptor({ keyDerivationOptions });

        const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);
        const payload = JSON.parse(vault);

        expect(payload).toStrictEqual({
          cipher: expect.any(String),
          iv: expect.stringMatching(/^[0-9a-f]{32}$/u),
          salt: expect.any(String),
          lib: ENCRYPTION_LIBRARY.original,
          keyMetadata: keyDerivationOptions,
        });
        expect(Buffer.from(payload.salt, 'base64')).toHaveLength(16);
        expect(vault).not.toContain('test test test');

        await expect(encryptor.decrypt(PASSWORD, vault)).resolves.toStrictEqual(
          VAULT_DATA,
        );
      },
    );

    it('uses a fresh salt and IV for every encryption', async () => {
      const first = JSON.parse(await encryptor.encrypt(PASSWORD, VAULT_DATA));
      const second = JSON.parse(await encryptor.encrypt(PASSWORD, VAULT_DATA));

      expect(second.salt).not.toBe(first.salt);
      expect(second.iv).not.toBe(first.iv);
      expect(second.cipher).not.toBe(first.cipher);
    });

    it('decrypts using the KDF options stored in the vault, not the encryptor defaults', async () => {
      const owaspEncryptor = new Encryptor({
        keyDerivationOptions: DERIVATION_OPTIONS_MINIMUM_OWASP2023,
      });
      const vault = await owaspEncryptor.encrypt(PASSWORD, VAULT_DATA);
      const deriveKeySpy = jest.spyOn(QuickCryptoLib, 'deriveKey');

      await expect(encryptor.decrypt(PASSWORD, vault)).resolves.toStrictEqual(
        VAULT_DATA,
      );
      expect(deriveKeySpy).toHaveBeenCalledWith(
        PASSWORD,
        JSON.parse(vault).salt,
        DERIVATION_OPTIONS_MINIMUM_OWASP2023,
      );
    });

    it('rejects when decrypting with the wrong password', async () => {
      const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);

      await expect(encryptor.decrypt(WRONG_PASSWORD, vault)).rejects.toThrow();
    });

    it('rejects when the cipher has been tampered with', async () => {
      const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);

      await expect(
        encryptor.decrypt(PASSWORD, tamperCipher(vault)),
      ).rejects.toThrow();
    });

    it('rejects when the salt or IV has been tampered with', async () => {
      const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);
      const payload = JSON.parse(vault);

      await expect(
        encryptor.decrypt(
          PASSWORD,
          JSON.stringify({ ...payload, salt: encryptor.generateSalt(16) }),
        ),
      ).rejects.toThrow();
      await expect(
        encryptor.decrypt(
          PASSWORD,
          JSON.stringify({ ...payload, iv: 'ff'.repeat(16) }),
        ),
      ).rejects.toThrow();
    });

    it.each(['', 'not json', '{"cipher":', 'undefined'])(
      'rejects with a SyntaxError before deriving a key for non-JSON text: %j',
      async (text) => {
        const deriveKeySpy = jest.spyOn(QuickCryptoLib, 'deriveKey');

        await expect(encryptor.decrypt(PASSWORD, text)).rejects.toThrow(
          SyntaxError,
        );
        expect(deriveKeySpy).not.toHaveBeenCalled();
      },
    );

    it('decrypts a legacy vault without keyMetadata using LEGACY_DERIVATION_OPTIONS', async () => {
      const { keyMetadata, ...legacyPayload } = JSON.parse(
        await encryptor.encrypt(PASSWORD, VAULT_DATA),
      );
      expect(keyMetadata).toStrictEqual(LEGACY_DERIVATION_OPTIONS);
      const deriveKeySpy = jest.spyOn(QuickCryptoLib, 'deriveKey');
      const owaspEncryptor = new Encryptor({
        keyDerivationOptions: DERIVATION_OPTIONS_MINIMUM_OWASP2023,
      });

      await expect(
        owaspEncryptor.decrypt(PASSWORD, JSON.stringify(legacyPayload)),
      ).resolves.toStrictEqual(VAULT_DATA);
      expect(deriveKeySpy).toHaveBeenCalledWith(
        PASSWORD,
        legacyPayload.salt,
        LEGACY_DERIVATION_OPTIONS,
      );
    });

    it('fails to decrypt a non-legacy vault whose keyMetadata was stripped', async () => {
      const owaspEncryptor = new Encryptor({
        keyDerivationOptions: DERIVATION_OPTIONS_MINIMUM_OWASP2023,
      });
      const { keyMetadata: _, ...strippedPayload } = JSON.parse(
        await owaspEncryptor.encrypt(PASSWORD, VAULT_DATA),
      );

      await expect(
        owaspEncryptor.decrypt(PASSWORD, JSON.stringify(strippedPayload)),
      ).rejects.toThrow();
    });
  });

  describe('encryptWithDetail -> decryptWithDetail', () => {
    it.each(DERIVATION_CASES)(
      'round-trips the vault and exports an importable key with %s derivation options',
      async (_, keyDerivationOptions) => {
        encryptor = new Encryptor({ keyDerivationOptions });

        const encrypted = await encryptor.encryptWithDetail(
          PASSWORD,
          VAULT_DATA,
        );
        const decrypted = await encryptor.decryptWithDetail(
          PASSWORD,
          encrypted.vault,
        );

        expect(decrypted.vault).toStrictEqual(VAULT_DATA);
        expect(decrypted.salt).toBe(JSON.parse(encrypted.vault).salt);
        expect(decrypted.exportedKeyString).toBe(encrypted.exportedKeyString);

        const importedKey = await encryptor.importKey(
          decrypted.exportedKeyString,
        );
        expect(importedKey).toStrictEqual({
          key: expect.any(String),
          keyMetadata: keyDerivationOptions,
          exportable: true,
          lib: ENCRYPTION_LIBRARY.original,
        });
        await expect(
          encryptor.decryptWithKey(importedKey, JSON.parse(encrypted.vault)),
        ).resolves.toStrictEqual(VAULT_DATA);
      },
    );

    it('produces vaults that decrypt() accepts and vice versa', async () => {
      const { vault: detailVault } = await encryptor.encryptWithDetail(
        PASSWORD,
        VAULT_DATA,
      );
      await expect(
        encryptor.decrypt(PASSWORD, detailVault),
      ).resolves.toStrictEqual(VAULT_DATA);

      const plainVault = await encryptor.encrypt(PASSWORD, VAULT_DATA);
      await expect(
        encryptor.decryptWithDetail(PASSWORD, plainVault),
      ).resolves.toMatchObject({ vault: VAULT_DATA });
    });

    it('rejects decryptWithDetail with the wrong password', async () => {
      const { vault } = await encryptor.encryptWithDetail(PASSWORD, VAULT_DATA);

      await expect(
        encryptor.decryptWithDetail(WRONG_PASSWORD, vault),
      ).rejects.toThrow();
    });

    it('rejects decryptWithDetail with a tampered cipher or non-JSON text', async () => {
      const { vault } = await encryptor.encryptWithDetail(PASSWORD, VAULT_DATA);

      await expect(
        encryptor.decryptWithDetail(PASSWORD, tamperCipher(vault)),
      ).rejects.toThrow();
      await expect(
        encryptor.decryptWithDetail(PASSWORD, 'not json'),
      ).rejects.toThrow(SyntaxError);
    });

    it('decrypts a legacy vault without keyMetadata using LEGACY_DERIVATION_OPTIONS', async () => {
      const { vault } = await encryptor.encryptWithDetail(PASSWORD, VAULT_DATA);
      const { keyMetadata: _, ...legacyPayload } = JSON.parse(vault);

      const result = await new Encryptor({
        keyDerivationOptions: DERIVATION_OPTIONS_MINIMUM_OWASP2023,
      }).decryptWithDetail(PASSWORD, JSON.stringify(legacyPayload));

      expect(result.vault).toStrictEqual(VAULT_DATA);
      expect(
        (await encryptor.importKey(result.exportedKeyString)).keyMetadata,
      ).toStrictEqual(LEGACY_DERIVATION_OPTIONS);
    });
  });

  describe('library routing', () => {
    // Current behaviour: key derivation and AES always go through
    // QuickCryptoLib, whatever `lib` tag the key or vault carries. The tag is
    // only echoed back. Vaults written by the deprecated native AES libraries
    // are therefore decrypted with QuickCrypto.
    it.each([
      ['original', ENCRYPTION_LIBRARY.original],
      ['forked', ENCRYPTION_LIBRARY.forked],
      ['quick-crypto', ENCRYPTION_LIBRARY.quickCrypto],
      ['unknown', 'random-lib'],
      ['missing', undefined],
    ])(
      'derives and decrypts with QuickCryptoLib when the vault lib is %s',
      async (_, lib) => {
        const vault = JSON.parse(await encryptor.encrypt(PASSWORD, VAULT_DATA));
        const quickDeriveKey = jest.spyOn(QuickCryptoLib, 'deriveKey');
        const quickDecrypt = jest.spyOn(QuickCryptoLib, 'decrypt');
        const aesDeriveKey = jest.spyOn(AesLib, 'deriveKey');
        const aesForkedDeriveKey = jest.spyOn(AesForkedLib, 'deriveKey');
        const aesDecrypt = jest.spyOn(AesLib, 'decrypt');
        const aesForkedDecrypt = jest.spyOn(AesForkedLib, 'decrypt');

        await expect(
          encryptor.decrypt(PASSWORD, JSON.stringify({ ...vault, lib })),
        ).resolves.toStrictEqual(VAULT_DATA);

        expect(quickDeriveKey).toHaveBeenCalledTimes(1);
        expect(quickDecrypt).toHaveBeenCalledTimes(1);
        expect(aesDeriveKey).not.toHaveBeenCalled();
        expect(aesForkedDeriveKey).not.toHaveBeenCalled();
        expect(aesDecrypt).not.toHaveBeenCalled();
        expect(aesForkedDecrypt).not.toHaveBeenCalled();
      },
    );

    it('defaults the key lib tag to quick-crypto in keyFromPassword', async () => {
      const key = await encryptor.keyFromPassword(
        PASSWORD,
        encryptor.generateSalt(),
      );

      expect(key.lib).toBe(ENCRYPTION_LIBRARY.quickCrypto);
    });

    it('tags re-encrypted vaults as original even when decrypted from another lib', async () => {
      const vault = JSON.parse(await encryptor.encrypt(PASSWORD, VAULT_DATA));
      const forkedVault = JSON.stringify({
        ...vault,
        lib: ENCRYPTION_LIBRARY.forked,
      });

      const data = await encryptor.decrypt(PASSWORD, forkedVault);
      const reEncrypted = JSON.parse(
        await encryptor.encrypt(PASSWORD, data as typeof VAULT_DATA),
      );

      expect(reEncrypted.lib).toBe(ENCRYPTION_LIBRARY.original);
    });
  });

  describe('isVaultUpdated', () => {
    it('is true for a freshly encrypted vault', async () => {
      const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);

      expect(encryptor.isVaultUpdated(vault)).toBe(true);
    });

    it('is false when the vault iteration count differs from the target', async () => {
      const vault = await encryptor.encrypt(PASSWORD, VAULT_DATA);

      expect(
        encryptor.isVaultUpdated(vault, DERIVATION_OPTIONS_MINIMUM_OWASP2023),
      ).toBe(false);
      expect(
        new Encryptor({
          keyDerivationOptions: DERIVATION_OPTIONS_MINIMUM_OWASP2023,
        }).isVaultUpdated(vault),
      ).toBe(false);
    });

    it('is false when the vault algorithm differs from the target', async () => {
      const vault = JSON.parse(await encryptor.encrypt(PASSWORD, VAULT_DATA));
      const otherAlgorithmVault = JSON.stringify({
        ...vault,
        keyMetadata: { ...vault.keyMetadata, algorithm: 'scrypt' },
      });

      expect(encryptor.isVaultUpdated(otherAlgorithmVault)).toBe(false);
    });
  });
});
