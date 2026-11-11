import {
  KeyringController,
  type ExportableKeyEncryptor,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/base-controller';
import { Encryptor } from './Encryptor';
import {
  DEFAULT_DERIVATION_OPTIONS,
  KeyDerivationIteration,
  LEGACY_DERIVATION_OPTIONS,
} from './constants';

// Back `react-native-quick-crypto` with Node's WebCrypto so PBKDF2/AES actually run.
jest.mock('react-native-quick-crypto', () => {
  const { webcrypto } = jest.requireActual('crypto');
  const toBuffer = (value: unknown) =>
    typeof value === 'string' ? Buffer.from(value, 'utf-8') : value;
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
          { ...algorithm, salt: toBuffer(algorithm.salt) },
          baseKey,
          length,
        ),
      exportKey: (...args: unknown[]) => webcrypto.subtle.exportKey(...args),
      encrypt: (...args: unknown[]) => webcrypto.subtle.encrypt(...args),
      decrypt: (...args: unknown[]) => webcrypto.subtle.decrypt(...args),
    },
  };
});

jest.setTimeout(60_000);

const PASSWORD = 'correct horse battery';
const MNEMONIC = 'test test test test test test test test test test test junk';

const legacyEncryptor = new Encryptor({
  keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
});
const defaultEncryptor = new Encryptor({
  keyDerivationOptions: DEFAULT_DERIVATION_OPTIONS,
});

const iterationsOf = (vault: string) =>
  JSON.parse(vault).keyMetadata.params.iterations;

const buildKeyringController = (
  encryptor: Encryptor,
  state?: Partial<KeyringController['state']>,
) =>
  new KeyringController({
    encryptor: encryptor as unknown as ExportableKeyEncryptor,
    messenger: new Messenger().getRestricted({
      name: 'KeyringController',
      allowedActions: [],
      allowedEvents: [],
    }),
    state,
    cacheEncryptionKey: true,
  });

describe('vault key derivation', () => {
  it('uses at least the OWASP 2023 minimum for new payloads', () => {
    expect(DEFAULT_DERIVATION_OPTIONS.params.iterations).toBeGreaterThanOrEqual(
      KeyDerivationIteration.OWASP2023Minimum,
    );
  });

  it('writes new payloads with the default iteration count and reads them back', async () => {
    const encrypted = await defaultEncryptor.encrypt(PASSWORD, { secret: 1 });

    expect(iterationsOf(encrypted)).toBe(
      KeyDerivationIteration.OWASP2023Minimum,
    );
    expect(defaultEncryptor.isVaultUpdated(encrypted)).toBe(true);
    expect(await defaultEncryptor.decrypt(PASSWORD, encrypted)).toEqual({
      secret: 1,
    });
  });

  it('still decrypts legacy 5,000-iteration payloads and flags them as outdated', async () => {
    const legacy = await legacyEncryptor.encrypt(PASSWORD, { secret: 2 });
    const { keyMetadata, ...legacyWithoutMetadata } = JSON.parse(legacy);

    expect(keyMetadata).toEqual(LEGACY_DERIVATION_OPTIONS);
    expect(defaultEncryptor.isVaultUpdated(legacy)).toBe(false);
    expect(await defaultEncryptor.decrypt(PASSWORD, legacy)).toEqual({
      secret: 2,
    });
    expect(
      await defaultEncryptor.decrypt(
        PASSWORD,
        JSON.stringify(legacyWithoutMetadata),
      ),
    ).toEqual({ secret: 2 });
  });

  it('creates new KeyringController vaults with the default iteration count', async () => {
    const controller = buildKeyringController(defaultEncryptor);
    await controller.createNewVaultAndRestore(
      PASSWORD,
      Buffer.from(MNEMONIC, 'utf8') as unknown as Uint8Array,
    );

    expect(iterationsOf(controller.state.vault as string)).toBe(
      KeyDerivationIteration.OWASP2023Minimum,
    );
  });

  it('re-encrypts a legacy vault with the default iteration count on unlock', async () => {
    const legacyController = buildKeyringController(legacyEncryptor);
    await legacyController.createNewVaultAndRestore(
      PASSWORD,
      Buffer.from(MNEMONIC, 'utf8') as unknown as Uint8Array,
    );
    const legacyVault = legacyController.state.vault as string;
    const [legacyAccount] = await legacyController.getAccounts();
    expect(iterationsOf(legacyVault)).toBe(KeyDerivationIteration.Legacy5000);

    const controller = buildKeyringController(defaultEncryptor, {
      vault: legacyVault,
    });
    await controller.submitPassword(PASSWORD);

    const upgradedVault = controller.state.vault as string;
    expect(upgradedVault).not.toBe(legacyVault);
    expect(iterationsOf(upgradedVault)).toBe(
      KeyDerivationIteration.OWASP2023Minimum,
    );
    expect(await controller.getAccounts()).toEqual([legacyAccount]);

    const reopened = buildKeyringController(defaultEncryptor, {
      vault: upgradedVault,
    });
    await reopened.submitPassword(PASSWORD);
    expect(reopened.state.vault).toBe(upgradedVault);
    expect(await reopened.getAccounts()).toEqual([legacyAccount]);
  });

  describe('stored key metadata validation', () => {
    const withKeyMetadata = (vault: string, keyMetadata: unknown) =>
      JSON.stringify({ ...JSON.parse(vault), keyMetadata });

    it.each([
      ['zero iterations', { algorithm: 'PBKDF2', params: { iterations: 0 } }],
      ['one iteration', { algorithm: 'PBKDF2', params: { iterations: 1 } }],
      [
        'negative iterations',
        { algorithm: 'PBKDF2', params: { iterations: -5000 } },
      ],
      [
        'fractional iterations',
        { algorithm: 'PBKDF2', params: { iterations: 600000.5 } },
      ],
      [
        'string iterations',
        { algorithm: 'PBKDF2', params: { iterations: '600000' } },
      ],
      [
        'too many iterations',
        { algorithm: 'PBKDF2', params: { iterations: 1e12 } },
      ],
      ['missing iterations', { algorithm: 'PBKDF2', params: {} }],
      [
        'unknown algorithm',
        { algorithm: 'scrypt', params: { iterations: 600000 } },
      ],
      ['non-object metadata', 'PBKDF2'],
    ])('rejects a payload with %s', async (_label, keyMetadata) => {
      const encrypted = await defaultEncryptor.encrypt(PASSWORD, { secret: 3 });
      const tampered = withKeyMetadata(encrypted, keyMetadata);

      await expect(
        defaultEncryptor.decrypt(PASSWORD, tampered),
      ).rejects.toThrow('Invalid key derivation options');
      await expect(
        defaultEncryptor.decryptWithDetail(PASSWORD, tampered),
      ).rejects.toThrow('Invalid key derivation options');
      expect(defaultEncryptor.isVaultUpdated(tampered)).toBe(false);
    });

    it('rejects an exported key whose metadata is out of range', async () => {
      const { exportedKeyString } = await defaultEncryptor.encryptWithDetail(
        PASSWORD,
        { secret: 4 },
      );
      const key = JSON.parse(
        Buffer.from(exportedKeyString, 'base64').toString(),
      );
      const tampered = Buffer.from(
        JSON.stringify({
          ...key,
          keyMetadata: { algorithm: 'PBKDF2', params: { iterations: 1 } },
        }),
      ).toString('base64');

      await expect(
        defaultEncryptor.importKey(exportedKeyString),
      ).resolves.toEqual(key);
      await expect(defaultEncryptor.importKey(tampered)).rejects.toThrow(
        'Invalid exported key structure',
      );
    });
  });
});
