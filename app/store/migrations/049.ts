import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '@sentry/react-native';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

/**
 * Reports a per-key migration failure to Sentry.
 *
 * @param key - The AsyncStorage key that could not be migrated.
 * @param error - The underlying error.
 */
const captureKeyFailure = (key: string, error: unknown) =>
  captureException(
    new Error(
      `Failed to migrate key "${key}" from AsyncStorage to MMKV! Error: ${error}`,
    ),
  );

/**
 * Reads all values for the given keys in a single batch, falling back to
 * per-key reads if the batch read fails so one unreadable key cannot block
 * the rest. Keys that cannot be read at all are reported and omitted, so
 * they are never removed from AsyncStorage.
 *
 * @param keys - The AsyncStorage keys to read.
 * @returns The readable `[key, value]` entries.
 */
async function readEntries(
  keys: readonly string[],
): Promise<readonly [string, string | null][]> {
  try {
    return [...(await AsyncStorage.multiGet(keys))];
  } catch {
    const entries = await Promise.all(
      keys.map(async (key): Promise<[string, string | null] | undefined> => {
        try {
          return [key, await AsyncStorage.getItem(key)];
        } catch (getItemError) {
          captureKeyFailure(key, getItemError);
          return undefined;
        }
      }),
    );
    return entries.filter(
      (entry): entry is [string, string | null] => entry !== undefined,
    );
  }
}

/**
 * Removes the given keys in a single batch, falling back to per-key removals
 * if the batch removal fails. Failures are reported rather than thrown so a
 * cleanup error cannot abort the migration chain.
 *
 * @param keys - The AsyncStorage keys to remove.
 */
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
