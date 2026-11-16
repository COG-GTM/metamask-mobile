import migrate, { controllerList } from './028';
import FilesystemStorage from 'redux-persist-filesystem-storage';
import { captureException } from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('redux-persist-filesystem-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  clear: jest.fn(),
}));

const controllerNames = [...new Set(controllerList.map(({ name }) => name))];
const controllerKey = (name) => `persist:${name}`;
const KEYRING_KEY = controllerKey('KeyringController');
const vaultData = { vault: 'encrypted-vault' };

let storage;

const seedStorage = () => {
  storage = new Map(
    controllerNames.map((name) => [
      controllerKey(name),
      JSON.stringify(
        name === 'KeyringController' ? vaultData : { someData: name },
      ),
    ]),
  );
};

const expectedBackgroundState = (exclude = []) =>
  Object.fromEntries(
    controllerNames
      .filter((name) => !exclude.includes(name))
      .map((name) => [
        name,
        name === 'KeyringController' ? vaultData : { someData: name },
      ]),
  );

const capturedMessages = () =>
  captureException.mock.calls.map(([error]) => error.message);

describe('Migration #28', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStorage();
    FilesystemStorage.getItem.mockImplementation(async (key) =>
      storage.has(key) ? storage.get(key) : null,
    );
    FilesystemStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value);
    });
    FilesystemStorage.removeItem.mockImplementation(async (key) => {
      storage.delete(key);
    });
  });

  it('should return state unchanged if it is not an object', async () => {
    const state = 'invalid_state';
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(capturedMessages()).toEqual([
      'Migration 28: Invalid root state: root state is not an object',
    ]);
    expect(FilesystemStorage.getItem).not.toHaveBeenCalled();
  });

  it('should return state unchanged if engine already exists in state', async () => {
    const state = { engine: {} };
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(FilesystemStorage.getItem).not.toHaveBeenCalled();
    expect(FilesystemStorage.setItem).not.toHaveBeenCalled();
    expect(FilesystemStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should properly migrate state', async () => {
    const result = await migrate({});
    const expectedState = {
      engine: { backgroundState: expectedBackgroundState() },
    };

    expect(result).toEqual(expectedState);
    expect(FilesystemStorage.getItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(FilesystemStorage.setItem).toHaveBeenCalledTimes(1);
    expect(FilesystemStorage.setItem).toHaveBeenCalledWith(
      'persist:root',
      expect.any(String),
      true,
    );
    expect(JSON.parse(storage.get('persist:root'))).toEqual(expectedState);
    expect(FilesystemStorage.removeItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect([...storage.keys()]).toEqual(['persist:root']);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should only remove controller files after the root file is written', async () => {
    let resolveRootWrite;
    FilesystemStorage.setItem.mockImplementation(
      (key, value) =>
        new Promise((resolve) => {
          resolveRootWrite = () => {
            storage.set(key, value);
            resolve();
          };
        }),
    );

    const migration = migrate({});
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FilesystemStorage.setItem).toHaveBeenCalledTimes(1);
    expect(FilesystemStorage.removeItem).not.toHaveBeenCalled();

    resolveRootWrite();
    await migration;

    expect(FilesystemStorage.removeItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect([...storage.keys()]).toEqual(['persist:root']);
  });

  it('should not remove any controller files when writing the root file fails', async () => {
    FilesystemStorage.setItem.mockRejectedValue(new Error('disk full'));

    const result = await migrate({});

    expect(result).toEqual({
      engine: { backgroundState: expectedBackgroundState() },
    });
    expect(FilesystemStorage.removeItem).not.toHaveBeenCalled();
    expect(storage.has('persist:root')).toBe(false);
    expect(storage.get(KEYRING_KEY)).toEqual(JSON.stringify(vaultData));
    controllerNames.forEach((name) => {
      expect(storage.has(controllerKey(name))).toBe(true);
    });
    expect(capturedMessages()).toEqual([
      'Migration 28: Failed to get root data: Error: disk full',
    ]);
  });

  it('should merge the remaining controllers and keep the file when reading one controller fails', async () => {
    FilesystemStorage.getItem.mockImplementation(async (key) => {
      if (key === KEYRING_KEY) {
        throw new Error('read failed');
      }
      return storage.has(key) ? storage.get(key) : null;
    });

    const result = await migrate({});

    expect(result).toEqual({
      engine: {
        backgroundState: expectedBackgroundState(['KeyringController']),
      },
    });
    expect(capturedMessages()).toEqual([
      `Migration 28: Failed to populate root object with persisted controller data for key ${KEYRING_KEY}: Error: read failed`,
    ]);
    expect(FilesystemStorage.setItem).toHaveBeenCalledTimes(1);
    expect(FilesystemStorage.removeItem).not.toHaveBeenCalledWith(KEYRING_KEY);
    expect(storage.get(KEYRING_KEY)).toEqual(JSON.stringify(vaultData));
    controllerNames
      .filter((name) => name !== 'KeyringController')
      .forEach((name) => {
        expect(FilesystemStorage.removeItem).toHaveBeenCalledWith(
          controllerKey(name),
        );
        expect(storage.has(controllerKey(name))).toBe(false);
      });
  });

  it('should remove a duplicated controller file when one of its reads succeeds', async () => {
    const accountTrackerKey = controllerKey('AccountTrackerController');
    let accountTrackerReads = 0;
    FilesystemStorage.getItem.mockImplementation(async (key) => {
      if (key === accountTrackerKey && accountTrackerReads++ === 0) {
        throw new Error('read failed');
      }
      return storage.has(key) ? storage.get(key) : null;
    });

    const result = await migrate({});

    expect(accountTrackerReads).toBe(2);
    expect(result).toEqual({
      engine: { backgroundState: expectedBackgroundState() },
    });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(FilesystemStorage.removeItem).toHaveBeenCalledWith(
      accountTrackerKey,
    );
    expect([...storage.keys()]).toEqual(['persist:root']);
  });

  it('should keep a controller file that cannot be parsed', async () => {
    storage.set(KEYRING_KEY, '{not valid json');

    const result = await migrate({});

    expect(result.engine.backgroundState).not.toHaveProperty(
      'KeyringController',
    );
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(capturedMessages()[0]).toContain(
      `Failed to populate root object with persisted controller data for key ${KEYRING_KEY}`,
    );
    expect(FilesystemStorage.removeItem).not.toHaveBeenCalledWith(KEYRING_KEY);
    expect(storage.get(KEYRING_KEY)).toEqual('{not valid json');
  });

  it('should strip redux-persist metadata from controller state', async () => {
    const persistMetadata = { version: -1, rehydrated: true };
    storage.set(
      KEYRING_KEY,
      JSON.stringify({ ...vaultData, _persist: persistMetadata }),
    );
    storage.set(
      controllerKey('NetworkController'),
      JSON.stringify({
        someData: 'NetworkController',
        _persist: persistMetadata,
      }),
    );

    const result = await migrate({});

    expect(result).toEqual({
      engine: { backgroundState: expectedBackgroundState() },
    });
    expect(storage.get('persist:root')).not.toContain('_persist');
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should keep removing other controller files when removing one fails', async () => {
    FilesystemStorage.removeItem.mockImplementation(async (key) => {
      if (key === controllerKey('NetworkController')) {
        throw new Error('remove failed');
      }
      storage.delete(key);
    });

    const result = await migrate({});

    expect(result).toEqual({
      engine: { backgroundState: expectedBackgroundState() },
    });
    expect(FilesystemStorage.removeItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(capturedMessages()).toEqual([
      'Migration 28: Failed to remove key persist:NetworkController: Error: remove failed',
    ]);
    expect([...storage.keys()].sort()).toEqual(
      ['persist:NetworkController', 'persist:root'].sort(),
    );
  });

  it('should leave out controllers that have no persisted file', async () => {
    storage.delete(controllerKey('SnapController'));
    storage.delete(controllerKey('PPOMController'));

    const result = await migrate({});

    expect(result).toEqual({
      engine: {
        backgroundState: expectedBackgroundState([
          'SnapController',
          'PPOMController',
        ]),
      },
    });
    expect(result.engine.backgroundState).not.toHaveProperty('SnapController');
    expect(captureException).not.toHaveBeenCalled();
    expect([...storage.keys()]).toEqual(['persist:root']);
  });
});
