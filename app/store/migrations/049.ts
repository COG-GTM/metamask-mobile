import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export default async function migrate(state: unknown) {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  const migratedKeys: string[] = [];

  for (const [key, value] of entries) {
    try {
      if (value != null) {
        storage.set(key, value);
      }
      migratedKeys.push(key);
    } catch (error) {
      captureException(
        new Error(
          `Failed to migrate key "${key}" from AsyncStorage to MMKV! Error: ${error}`,
        ),
      );
    }
  }

  if (migratedKeys.length > 0) {
    await AsyncStorage.multiRemove(migratedKeys);
  }

  return state;
}
