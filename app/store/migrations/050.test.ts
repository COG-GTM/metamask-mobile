import migrate from './050';
import DefaultPreference from 'react-native-default-preference';
import { captureException } from '@sentry/react-native';
import StorageWrapper from '../storage-wrapper';

const defaultPreferenceItems: { [key: string]: string | null } = {
  valueA: 'a',
  valueB: 'true',
  valueC: 'myValue',
  valueD: null,
};

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
jest.mock('../storage-wrapper', () => ({
  setItem: jest.fn().mockResolvedValue(''),
}));
jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
  clear: jest.fn(),
  getAll: jest.fn().mockReturnValue(defaultPreferenceItems),
}));

const mockSetItem = StorageWrapper.setItem as jest.Mock;
const mockClear = DefaultPreference.clear as jest.Mock;
const mockGetAll = DefaultPreference.getAll as jest.Mock;
const mockCaptureException = captureException as jest.Mock;

describe('Migration #50', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue('');
    mockClear.mockResolvedValue(undefined);
    mockGetAll.mockResolvedValue(defaultPreferenceItems);
  });

  it('migrates default preferences values to mmkv and clears DefaultPreference', async () => {
    const state = { some: 'state' };
    const newState = await migrate(state);

    expect(newState).toBe(state);

    expect(StorageWrapper.setItem).toHaveBeenCalledTimes(3);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueA', 'a');
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueB', 'true');
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueC', 'myValue');

    expect(DefaultPreference.clear).toHaveBeenCalledTimes(4);
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueA');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueB');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueC');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueD');

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('does nothing when DefaultPreference has no keys', async () => {
    mockGetAll.mockResolvedValue({});
    const state = { some: 'state' };

    const newState = await migrate(state);

    expect(newState).toBe(state);
    expect(StorageWrapper.setItem).not.toHaveBeenCalled();
    expect(DefaultPreference.clear).not.toHaveBeenCalled();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('reports to Sentry and continues with remaining keys when clear throws for one key', async () => {
    mockClear.mockImplementation(async (key: string) => {
      if (key === 'valueB') {
        throw new Error('clear failed');
      }
    });

    const state = { some: 'state' };
    const newState = await migrate(state);

    expect(newState).toBe(state);
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      new Error(
        'Migration 50: Failed to migrate key "valueB" from DefaultPreference to MMKV! Error: Error: clear failed',
      ),
    );

    expect(StorageWrapper.setItem).toHaveBeenCalledTimes(3);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueC', 'myValue');
    expect(DefaultPreference.clear).toHaveBeenCalledTimes(4);
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueC');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueD');
  });

  it('does not clear a key whose setItem throws synchronously and continues with remaining keys', async () => {
    mockSetItem.mockImplementation((key: string) => {
      if (key === 'valueA') {
        throw new Error('sync setItem failed');
      }
      return Promise.resolve('');
    });

    await migrate({});

    expect(DefaultPreference.clear).not.toHaveBeenCalledWith('valueA');
    expect(DefaultPreference.clear).toHaveBeenCalledTimes(3);
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueB');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueC');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueD');

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      new Error(
        'Migration 50: Failed to migrate key "valueA" from DefaultPreference to MMKV! Error: Error: sync setItem failed',
      ),
    );
  });

  it('does not clear a key whose setItem rejects and reports the failure to Sentry', async () => {
    mockSetItem.mockImplementation((key: string) =>
      key === 'valueC'
        ? Promise.reject(new Error('MMKV write failed'))
        : Promise.resolve(''),
    );

    await migrate({});

    expect(DefaultPreference.clear).not.toHaveBeenCalledWith('valueC');
    expect(DefaultPreference.clear).toHaveBeenCalledTimes(3);
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueA');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueB');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueD');

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      new Error(
        'Migration 50: Failed to migrate key "valueC" from DefaultPreference to MMKV! Error: Error: MMKV write failed',
      ),
    );
  });

  it('awaits setItem before clearing the key', async () => {
    const order: string[] = [];
    mockSetItem.mockImplementation(
      (key: string) =>
        new Promise((resolve) =>
          setTimeout(() => {
            order.push(`set:${key}`);
            resolve('');
          }, 0),
        ),
    );
    mockClear.mockImplementation(async (key: string) => {
      order.push(`clear:${key}`);
    });

    await migrate({});

    expect(order).toEqual([
      'set:valueA',
      'clear:valueA',
      'set:valueB',
      'clear:valueB',
      'set:valueC',
      'clear:valueC',
      'clear:valueD',
    ]);
  });
});
