import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

const captureKeyFailure = (key: string, error: unknown) =>
  captureException(
    new Error(
      `Failed to migrate key "${key}" from AsyncStorage to MMKV! Error: ${error}`,
    ),
  );

async function readEntries(keys: readonly string[]) {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch {
    // Fall back to per-key reads so one unreadable key cannot block the rest.
    return Promise.all(
      keys.map(async (key): Promise<[string, string | null]> => {
        try {
          return [key, await AsyncStorage.getItem(key)];
        } catch (getItemError) {
          captureKeyFailure(key, getItemError);
          return [key, null];
        }
      }),
    );
  }
}

async function removeKeys(keys: string[]) {
  if (keys.length === 0) {
    return;
  }
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    await Promise.all(
      keys.map(async (key) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (removeItemError) {
          captureKeyFailure(key, removeItemError);
        }
      }),
    );
  }
}

export default async function migrate(state: unknown) {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await readEntries(keys);
  const migratedKeys: string[] = [];

  for (const [key, value] of entries) {
    try {
      if (value != null) {
        storage.set(key, value);
      }
      migratedKeys.push(key);
    } catch (error) {
      captureKeyFailure(key, error);
    }
  }

  await removeKeys(migratedKeys);

  return state;
}
