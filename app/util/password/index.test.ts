import {
  doesPasswordMatch,
  getPasswordStrengthWord,
  passwordRequirementsMet,
} from '.';
import { UNRECOGNIZED_PASSWORD_STRENGTH } from '../../constants/error';
import SecureKeychain from '../../core/SecureKeychain';

const mockExportSeedPhrase = jest.fn();

jest.mock('../../core/Engine', () => ({
  context: {
    KeyringController: {
      exportSeedPhrase: (password: string) => mockExportSeedPhrase(password),
    },
  },
}));

jest.mock('../../core/SecureKeychain', () => ({
  getGenericPassword: jest.fn(),
}));

const mockGetGenericPassword = SecureKeychain.getGenericPassword as jest.Mock;

const STORED_PASSWORD = 'correct-horse-battery-staple';

describe('getPasswordStrength', () => {
  it('should return correct values', () => {
    for (let i = 0; i < 6; i++) {
      const password_strength = getPasswordStrengthWord(i);
      if (i < 3) {
        expect(password_strength).toEqual('weak');
      } else if (i === 3) {
        expect(password_strength).toEqual('good');
      } else if (i >= 4) {
        expect(password_strength).toEqual('strong');
      }
    }
  });
  it('should throw when password strength is unrecognized', () => {
    expect(() => getPasswordStrengthWord(-1)).toThrowError(
      UNRECOGNIZED_PASSWORD_STRENGTH,
    );
  });
});

describe('passwordRequirementsMet', () => {
  it('should pass when password is 8 in length', () => {
    expect(passwordRequirementsMet('lolololo')).toEqual(true);
  });
  it('should pass when password is gt 8 in length', () => {
    expect(passwordRequirementsMet('lololololol')).toEqual(true);
  });
  it('should fail when password is lt 8 in length', () => {
    expect(passwordRequirementsMet('lol')).toEqual(false);
  });
});

describe('doesPasswordMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenericPassword.mockResolvedValue({
      username: 'metamask-user',
      password: STORED_PASSWORD,
    });
    mockExportSeedPhrase.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it('returns valid true when the input matches a stored password that decrypts the vault', async () => {
    const result = await doesPasswordMatch(STORED_PASSWORD);

    expect(mockGetGenericPassword).toHaveBeenCalledTimes(1);
    expect(mockExportSeedPhrase).toHaveBeenCalledWith(STORED_PASSWORD);
    expect(result).toStrictEqual({
      valid: true,
      message: 'The input matches the stored password',
    });
  });

  it.each([
    ['a different password', 'wrong-password'],
    ['an empty string', ''],
    ['a prefix of the stored password', STORED_PASSWORD.slice(0, -1)],
    ['the stored password with extra characters', `${STORED_PASSWORD} `],
    ['the stored password in a different case', STORED_PASSWORD.toUpperCase()],
  ])('returns valid false when the input is %s', async (_, input) => {
    const result = await doesPasswordMatch(input);

    expect(mockExportSeedPhrase).toHaveBeenCalledWith(STORED_PASSWORD);
    expect(result).toStrictEqual({
      valid: false,
      message: 'The input does not match the stored password',
    });
  });

  it('returns valid false with "no password stored" when the keychain has no credentials', async () => {
    mockGetGenericPassword.mockResolvedValue(null);

    const result = await doesPasswordMatch(STORED_PASSWORD);

    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      valid: false,
      message: 'no password stored',
    });
  });

  it('returns valid false with the error message when the stored password no longer decrypts the vault, even if the input matches it', async () => {
    mockExportSeedPhrase.mockRejectedValue(new Error('Incorrect password'));

    const result = await doesPasswordMatch(STORED_PASSWORD);

    expect(mockExportSeedPhrase).toHaveBeenCalledWith(STORED_PASSWORD);
    expect(result).toStrictEqual({
      valid: false,
      message: 'Error: Incorrect password',
    });
  });

  it('returns valid false with the error message when exportSeedPhrase throws synchronously', async () => {
    mockExportSeedPhrase.mockImplementation(() => {
      throw new Error('KeyringController is locked');
    });

    const result = await doesPasswordMatch(STORED_PASSWORD);

    expect(result).toStrictEqual({
      valid: false,
      message: 'Error: KeyringController is locked',
    });
  });

  it('returns valid false with the error message when reading the keychain throws', async () => {
    mockGetGenericPassword.mockRejectedValue(
      new Error('User canceled the operation'),
    );

    const result = await doesPasswordMatch(STORED_PASSWORD);

    expect(mockExportSeedPhrase).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      valid: false,
      message: 'Error: User canceled the operation',
    });
  });
});
