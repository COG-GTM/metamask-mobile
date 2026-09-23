import {
  failedSeedPhraseRequirements,
  parseSeedPhrase,
  parseVaultValue,
} from '.';
import Logger from '../Logger';
import { Encryptor } from '../../core/Encryptor';

jest.mock('../Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

jest.mock('../../core/Encryptor', () => ({
  Encryptor: jest.fn(),
  LEGACY_DERIVATION_OPTIONS: {},
}));

const VALID_24 =
  'verb middle giant soon wage common wide tool gentle garlic issue nut retreat until album recall expire bronze bundle live accident expect dry cook';
const VALID_12 = VALID_24.split(' ').splice(0, 12).join(' ');

describe('failedSeedPhraseRequirements', () => {
  it('Should pass for 12 word mnemonic', () => {
    expect(failedSeedPhraseRequirements(VALID_12)).toEqual(false);
  });
  it('Should pass for 24 word mnemonic', () => {
    expect(failedSeedPhraseRequirements(VALID_24)).toEqual(false);
  });
  it('Should fail for 12 + 1 word mnemonic', () => {
    const plus_one = VALID_12 + ' lol';
    expect(failedSeedPhraseRequirements(plus_one)).toEqual(true);
  });
  it('Should fail for 24 + 1 word mnemonic', () => {
    const plus_one = VALID_24 + ' lol';
    expect(failedSeedPhraseRequirements(plus_one)).toEqual(true);
  });
});

describe('parseSeedPhrase', () => {
  it('Should handle leading spaces', () => {
    expect(parseSeedPhrase(`   ${VALID_12}`)).toEqual(VALID_12);
  });
  it('Should handle trailing spaces', () => {
    expect(parseSeedPhrase(`${VALID_12}   `)).toEqual(VALID_12);
  });
  it('Should handle additional spaces', () => {
    expect(parseSeedPhrase(`${VALID_12.split(' ').join('   ')}   `)).toEqual(
      VALID_12,
    );
  });
  it('Should handle uppercase', () => {
    expect(parseSeedPhrase(`   ${String(VALID_12).toUpperCase()}`)).toEqual(
      VALID_12,
    );
  });
});

describe('parseVaultValue', () => {
  const ENCRYPTED_VAULT = JSON.stringify({
    cipher: 'cipher',
    salt: 'salt',
    iv: 'iv',
    lib: 'original',
  });
  const mockEncryptor = Encryptor as unknown as jest.Mock;
  const mockLoggerError = Logger.error as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the mnemonic when the vault decrypts', async () => {
    const decrypt = jest
      .fn()
      .mockResolvedValue([{ data: { mnemonic: VALID_12 } }]);
    mockEncryptor.mockImplementation(() => ({ decrypt }));

    await expect(parseVaultValue('password', ENCRYPTED_VAULT)).resolves.toEqual(
      VALID_12,
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('logs the decryption failure reason without leaking secrets', async () => {
    const decryptError = new Error('Decrypt failed');
    mockEncryptor.mockImplementation(() => ({
      decrypt: jest.fn().mockRejectedValue(decryptError),
    }));

    await expect(
      parseVaultValue('password', ENCRYPTED_VAULT),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(decryptError, {
      context: 'parseVaultValue',
      reason: 'vault_decrypt_failed',
    });
    const loggedMetadata = JSON.stringify(mockLoggerError.mock.calls[0][1]);
    expect(loggedMetadata).not.toContain('password');
    expect(loggedMetadata).not.toContain('cipher');
  });

  it('distinguishes malformed JSON from a decryption failure', async () => {
    await expect(
      parseVaultValue('password', '{not json}'),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      context: 'parseVaultValue',
      reason: 'vault_json_parse_failed',
    });
  });

  it('reports a truncated vault that is missing its closing brace', async () => {
    await expect(
      parseVaultValue('password', '{"cipher":"abc","salt":"def"'),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      context: 'parseVaultValue',
      reason: 'vault_json_parse_failed',
    });
  });

  it('stays quiet for a raw seed phrase', async () => {
    await expect(
      parseVaultValue('password', VALID_12),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('reports a vault missing encryption fields', async () => {
    await expect(
      parseVaultValue('password', JSON.stringify({ cipher: 'cipher' })),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      context: 'parseVaultValue',
      reason: 'vault_shape_invalid',
    });
  });

  it('reports a decrypted vault without a mnemonic', async () => {
    mockEncryptor.mockImplementation(() => ({
      decrypt: jest.fn().mockResolvedValue([{ data: {} }]),
    }));

    await expect(
      parseVaultValue('password', ENCRYPTED_VAULT),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      context: 'parseVaultValue',
      reason: 'vault_mnemonic_missing',
    });
  });
});
