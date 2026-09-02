import migrate from './000';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #0', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('groups address book entries by chainId', () => {
    const entry1 = { address: '0xa', chainId: 1, name: 'a' };
    const entry2 = { address: '0xb', chainId: '1', name: 'b' };
    const entry3 = { address: '0xc', chainId: 5, name: 'c' };
    const state = {
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: { '0xa': entry1, '0xb': entry2, '0xc': entry3 },
          },
        },
      },
    };

    const newState = migrate(state);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          AddressBookController: {
            addressBook: {
              '1': { '0xa': entry1, '0xb': entry2 },
              '5': { '0xc': entry3 },
            },
          },
        },
      },
    });
  });

  it('captures an exception and returns state unchanged when shape is invalid', () => {
    const state = { engine: { backgroundState: {} } };
    expect(migrate(state)).toBe(state);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException.mock.calls[0][0].message).toContain(
      'Migration 0',
    );
  });
});
