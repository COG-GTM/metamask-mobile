import migrate, { storage as mmkvStorage } from './049';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

const mockedGetAllKeys = jest.mocked(AsyncStorage.getAllKeys);
const mockedGetItem = jest.mocked(AsyncStorage.getItem);
const mockedRemoveItem = jest.mocked(AsyncStorage.removeItem);
const originalGetAllKeys = mockedGetAllKeys.getMockImplementation();
const originalGetItem = mockedGetItem.getMockImplementation();
const originalRemoveItem = mockedRemoveItem.getMockImplementation();

const asyncStorageItems: { [key: string]: string } = {
  valueA: 'a',
  valueB: 'true',
  valueC: 'myValue',
};

const seedAsyncStorage = async () => {
  for (const key in asyncStorageItems) {
    await AsyncStorage.setItem(key, asyncStorageItems[key]);
  }
};

describe('Migration #49', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mmkvStorage.clearAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedGetAllKeys.mockImplementation(originalGetAllKeys);
    mockedGetItem.mockImplementation(originalGetItem);
    mockedRemoveItem.mockImplementation(originalRemoveItem);
  });

  it('migrates asyncStorage values to mmkv ', async () => {
    // set asyncStorageItems to AsyncStorage
    await seedAsyncStorage();

    await migrate({});

    // make sure all AsyncStorage items are removed
    const keys = await AsyncStorage.getAllKeys();
    // loop through all AsyncStorage keys and make sure empty
    for (const key of keys) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }

    // now check that all MMKV values match original AsyncStorage values
    for (const key in asyncStorageItems) {
      expect(mmkvStorage.getString(key)).toEqual(asyncStorageItems[key]);
    }
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('writes each key to mmkv before removing it from AsyncStorage', async () => {
    await seedAsyncStorage();
    const setSpy = jest.spyOn(mmkvStorage, 'set');

    await migrate({});

    for (const key in asyncStorageItems) {
      const setCallIndex = setSpy.mock.calls.findIndex(([k]) => k === key);
      const removeCallIndex = mockedRemoveItem.mock.calls.findIndex(
        ([k]) => k === key,
      );
      expect(setCallIndex).toBeGreaterThanOrEqual(0);
      expect(removeCallIndex).toBeGreaterThanOrEqual(0);
      expect(setSpy.mock.invocationCallOrder[setCallIndex]).toBeLessThan(
        mockedRemoveItem.mock.invocationCallOrder[removeCallIndex],
      );
    }
  });

  it('keeps a key in AsyncStorage, reports it and continues when the mmkv write fails', async () => {
    await seedAsyncStorage();
    const writeError = new Error('mmkv write failed');
    const originalSet = mmkvStorage.set.bind(mmkvStorage);
    jest
      .spyOn(mmkvStorage, 'set')
      .mockImplementation(
        (key: string, value: string | number | boolean | Uint8Array) => {
          if (key === 'valueB') {
            throw writeError;
          }
          originalSet(key, value);
        },
      );

    const state = {};
    const newState = await migrate(state);

    expect(newState).toBe(state);
    expect(mockedRemoveItem).not.toHaveBeenCalledWith('valueB');
    expect(await AsyncStorage.getItem('valueB')).toBe('true');
    expect(mmkvStorage.getString('valueB')).toBeUndefined();

    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Failed to migrate key "valueB" from AsyncStorage to MMKV! Error: ${writeError}`,
      ),
    );

    for (const key of ['valueA', 'valueC']) {
      expect(mmkvStorage.getString(key)).toEqual(asyncStorageItems[key]);
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('keeps a key in AsyncStorage, reports it and continues when reading it fails', async () => {
    await seedAsyncStorage();
    const readError = new Error('AsyncStorage read failed');
    mockedGetItem.mockImplementation(async (key: string) => {
      if (key === 'valueA') {
        throw readError;
      }
      return (await originalGetItem?.(key)) ?? null;
    });
    const setSpy = jest.spyOn(mmkvStorage, 'set');

    await migrate({});

    expect(setSpy).not.toHaveBeenCalledWith('valueA', expect.anything());
    expect(mockedRemoveItem).not.toHaveBeenCalledWith('valueA');
    expect(mmkvStorage.getString('valueA')).toBeUndefined();

    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Failed to migrate key "valueA" from AsyncStorage to MMKV! Error: ${readError}`,
      ),
    );

    mockedGetItem.mockImplementation(originalGetItem);
    expect(await AsyncStorage.getItem('valueA')).toBe('a');
    for (const key of ['valueB', 'valueC']) {
      expect(mmkvStorage.getString(key)).toEqual(asyncStorageItems[key]);
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('keeps the copied value, reports it and continues when removing the key fails', async () => {
    await seedAsyncStorage();
    const removeError = new Error('AsyncStorage remove failed');
    mockedRemoveItem.mockImplementation(async (key: string) => {
      if (key === 'valueC') {
        throw removeError;
      }
      return originalRemoveItem?.(key);
    });

    await migrate({});

    expect(mmkvStorage.getString('valueC')).toEqual('myValue');
    expect(await AsyncStorage.getItem('valueC')).toBe('myValue');
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Failed to migrate key "valueC" from AsyncStorage to MMKV! Error: ${removeError}`,
      ),
    );
    for (const key of ['valueA', 'valueB']) {
      expect(mmkvStorage.getString(key)).toEqual(asyncStorageItems[key]);
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('removes a key with a null value without writing it to mmkv', async () => {
    await AsyncStorage.setItem('valueA', 'a');
    mockedGetAllKeys.mockResolvedValueOnce(['nullKey', 'valueA']);
    const setSpy = jest.spyOn(mmkvStorage, 'set');

    await migrate({});

    expect(mockedGetItem).toHaveBeenCalledWith('nullKey');
    expect(setSpy).not.toHaveBeenCalledWith('nullKey', expect.anything());
    expect(mmkvStorage.contains('nullKey')).toBe(false);
    expect(mockedRemoveItem).toHaveBeenCalledWith('nullKey');

    expect(setSpy).toHaveBeenCalledWith('valueA', 'a');
    expect(mmkvStorage.getString('valueA')).toEqual('a');
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('returns the state unchanged when AsyncStorage has no keys', async () => {
    const setSpy = jest.spyOn(mmkvStorage, 'set');
    const state = { engine: { backgroundState: {} } };

    const newState = await migrate(state);

    expect(newState).toBe(state);
    expect(newState).toStrictEqual({ engine: { backgroundState: {} } });
    expect(mockedGetItem).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(mockedRemoveItem).not.toHaveBeenCalled();
    expect(mmkvStorage.getAllKeys()).toEqual([]);
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });
});
