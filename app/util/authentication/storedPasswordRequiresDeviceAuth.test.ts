import StorageWrapper from '../../store/storage-wrapper';
import AUTHENTICATION_TYPE from '../../constants/userProperties';
import {
  BIOMETRY_CHOICE,
  PASSCODE_CHOICE,
  TRUE,
} from '../../constants/storage';
import { storedPasswordRequiresDeviceAuth } from './storedPasswordRequiresDeviceAuth';

jest.mock('../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
}));

const mockGetItem = StorageWrapper.getItem as jest.Mock;

const withStorage = (values: Record<string, string>) =>
  mockGetItem.mockImplementation(async (key: string) => values[key] ?? null);

describe('storedPasswordRequiresDeviceAuth', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
  });

  it.each([AUTHENTICATION_TYPE.REMEMBER_ME, AUTHENTICATION_TYPE.PASSWORD])(
    'returns false for %s even when device auth flags are set',
    async (authType) => {
      withStorage({ [BIOMETRY_CHOICE]: TRUE, [PASSCODE_CHOICE]: TRUE });
      expect(await storedPasswordRequiresDeviceAuth(authType)).toBe(false);
    },
  );

  it('returns true for biometrics when the password was stored with biometrics', async () => {
    withStorage({ [BIOMETRY_CHOICE]: TRUE });
    expect(
      await storedPasswordRequiresDeviceAuth(AUTHENTICATION_TYPE.BIOMETRIC),
    ).toBe(true);
  });

  it('returns false for biometrics when no biometric choice is stored', async () => {
    withStorage({});
    expect(
      await storedPasswordRequiresDeviceAuth(AUTHENTICATION_TYPE.BIOMETRIC),
    ).toBe(false);
  });

  it('returns true for device passcode when the password was stored with a passcode', async () => {
    withStorage({ [PASSCODE_CHOICE]: TRUE });
    expect(
      await storedPasswordRequiresDeviceAuth(AUTHENTICATION_TYPE.PASSCODE),
    ).toBe(true);
  });

  it('returns false for device passcode when no passcode choice is stored', async () => {
    withStorage({ [BIOMETRY_CHOICE]: TRUE });
    expect(
      await storedPasswordRequiresDeviceAuth(AUTHENTICATION_TYPE.PASSCODE),
    ).toBe(false);
  });
});
