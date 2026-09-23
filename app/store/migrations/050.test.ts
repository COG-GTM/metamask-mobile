import migrate from './050';
import DefaultPreference from 'react-native-default-preference';
import { captureException } from '@sentry/react-native';
import StorageWrapper from '../storage-wrapper';
import { AsyncLogger, invalidateMetricsOptInCache } from '../../util/Logger';
import { AGREED } from '../../constants/storage';

const defaultPreferenceItems: { [key: string]: string | null } = {
  valueA: 'a',
  valueB: 'true',
  valueC: 'myValue',
  valueD: null,
};

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn(),
}));
jest.mock('../storage-wrapper', () => ({
  setItem: jest.fn().mockResolvedValue(''),
  getItem: jest.fn().mockResolvedValue(null),
}));
jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
  clear: jest.fn(),
  getAll: jest.fn().mockReturnValue(defaultPreferenceItems),
}));

describe('Migration #50', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('migrates default preferences values to mmkv and clears DefaultPreference', async () => {
    await migrate({});

    expect(StorageWrapper.setItem).toHaveBeenCalledTimes(3);
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueA', 'a');
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueB', 'true');
    expect(StorageWrapper.setItem).toHaveBeenCalledWith('valueC', 'myValue');

    expect(DefaultPreference.clear).toHaveBeenCalledTimes(4);
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueA');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueB');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueC');
    expect(DefaultPreference.clear).toHaveBeenCalledWith('valueD');
  });

  it('invalidates the logger metrics opt-in cache so the migrated value is picked up', async () => {
    const mockedGetItem = jest.mocked(StorageWrapper.getItem);
    const mockedCaptureException = jest.mocked(captureException);
    invalidateMetricsOptInCache();

    mockedGetItem.mockResolvedValue(null);
    await AsyncLogger.error(new Error('before migration'));
    expect(mockedCaptureException).not.toHaveBeenCalled();

    mockedGetItem.mockResolvedValue(AGREED);
    await migrate({});
    await AsyncLogger.error(new Error('after migration'));

    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
  });
});
