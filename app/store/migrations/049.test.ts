import migrate, { storage as mmkvStorage } from './049';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorageItems: { [key: string]: string } = {
  valueA: 'a',
  valueB: 'true',
  valueC: 'myValue',
};

describe('Migration #49', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('migrates asyncStorage values to mmkv ', async () => {
    // set asyncStorageItems to AsyncStorage
    for (const key in asyncStorageItems) {
      await AsyncStorage.setItem(key, asyncStorageItems[key]);
    }

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
  });

  it('falls back to per-key reads when multiGet rejects', async () => {
    await AsyncStorage.setItem('batchFailA', 'a');
    await AsyncStorage.setItem('batchFailB', 'b');
    jest
      .spyOn(AsyncStorage, 'multiGet')
      .mockRejectedValueOnce(new Error('multiGet failed'));

    await expect(migrate({})).resolves.toEqual({});

    expect(mmkvStorage.getString('batchFailA')).toEqual('a');
    expect(mmkvStorage.getString('batchFailB')).toEqual('b');
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('falls back to per-key removes when multiRemove rejects', async () => {
    await AsyncStorage.setItem('removeFail', 'x');
    jest
      .spyOn(AsyncStorage, 'multiRemove')
      .mockRejectedValueOnce(new Error('multiRemove failed'));

    await expect(migrate({})).resolves.toEqual({});

    expect(mmkvStorage.getString('removeFail')).toEqual('x');
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });
});
