import { KeyringController } from '@metamask/keyring-controller';
import { Messenger } from '@metamask/base-controller';
import Engine from './Engine';
import {
  Encryptor,
  LEGACY_DERIVATION_OPTIONS,
  DERIVATION_OPTIONS_MINIMUM_OWASP2023,
} from '../Encryptor';

jest.unmock('./Engine');
jest.mock('../BackupVault', () => ({
  backupVault: jest.fn().mockResolvedValue({ success: true, vault: 'vault' }),
}));
jest.mock('../../store', () => ({
  store: { getState: jest.fn(() => ({ engine: {} })) },
}));
jest.mock('../../selectors/settings', () => ({
  ...jest.requireActual('../../selectors/settings'),
  selectBasicFunctionalityEnabled: jest.fn().mockReturnValue(true),
}));
jest.mock('../../util/phishingDetection', () => ({
  isProductSafetyDappScanningEnabled: jest.fn().mockReturnValue(false),
  getPhishingTestResult: jest.fn().mockReturnValue({ result: true }),
}));

jest.mock('@metamask/assets-controllers', () => {
  const actualControllers = jest.requireActual('@metamask/assets-controllers');
  class MockRatesController extends actualControllers.RatesController {
    start = jest.fn().mockImplementation(() => Promise.resolve());
  }
  return { ...actualControllers, RatesController: MockRatesController };
});

// Back the vault encryptor with real WebCrypto so vaults round-trip.
jest.mock('react-native-quick-crypto', () => {
  const { webcrypto } = jest.requireActual('crypto');
  const toBytes = (value: unknown) =>
    typeof value === 'string' ? Buffer.from(value, 'utf-8') : value;
  return {
    getRandomValues: (array: Uint8Array) => webcrypto.getRandomValues(array),
    subtle: {
      importKey: webcrypto.subtle.importKey.bind(webcrypto.subtle),
      exportKey: webcrypto.subtle.exportKey.bind(webcrypto.subtle),
      encrypt: webcrypto.subtle.encrypt.bind(webcrypto.subtle),
      decrypt: webcrypto.subtle.decrypt.bind(webcrypto.subtle),
      deriveBits: jest.fn(
        (params: { salt: unknown }, key: unknown, length: number) =>
          webcrypto.subtle.deriveBits(
            { ...params, salt: toBytes(params.salt) },
            key,
            length,
          ),
      ),
    },
  };
});

const PASSWORD = 'correct horse battery';

const vaultIterations = (vault: string | undefined) =>
  JSON.parse(vault as string).keyMetadata.params.iterations;

const createLegacyVault = async () => {
  // @ts-expect-error Encryptor.encryptWithKey is typed for EncryptionKey, not unknown
  const keyringController = new KeyringController({
    encryptor: new Encryptor({
      keyDerivationOptions: LEGACY_DERIVATION_OPTIONS,
    }),
    messenger: new Messenger().getRestricted({
      name: 'KeyringController',
      allowedActions: [],
      allowedEvents: [],
    }),
    cacheEncryptionKey: true,
  });
  await keyringController.createNewVaultAndKeychain(PASSWORD);
  return keyringController.state;
};

describe('Engine vault encryption', () => {
  afterEach(() => {
    Engine.destroyEngine();
  });

  it('creates new vaults with the OWASP 2023 minimum PBKDF2 iterations', async () => {
    const engine = Engine.init({});
    const { KeyringController: keyringController } = engine.context;

    await keyringController.createNewVaultAndKeychain(PASSWORD);

    expect(vaultIterations(keyringController.state.vault)).toBe(
      DERIVATION_OPTIONS_MINIMUM_OWASP2023.params.iterations,
    );
  });

  it('re-encrypts a legacy 5,000-iteration vault on password unlock', async () => {
    const legacyState = await createLegacyVault();
    expect(vaultIterations(legacyState.vault)).toBe(5_000);

    const engine = Engine.init({}, legacyState);
    const { KeyringController: keyringController } = engine.context;
    const accounts = legacyState.keyrings[0].accounts;

    await keyringController.submitPassword(PASSWORD);

    expect(keyringController.state.vault).not.toBe(legacyState.vault);
    expect(vaultIterations(keyringController.state.vault)).toBe(600_000);

    await keyringController.setLocked();
    await keyringController.submitPassword(PASSWORD);
    expect(keyringController.state.keyrings[0].accounts).toEqual(accounts);

    await expect(keyringController.submitPassword('wrong')).rejects.toThrow();
  });
});
