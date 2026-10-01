import { WALLETCONNECT_SESSIONS } from '../../constants/storage';

const mockStore = new Map<string, string>();
const mockKeychain = new Map<string, string>();
const mockKeychainState = { setFails: false, getFails: false };
const mockEncryptDelays: number[] = [];
const mockStoreState = { getFails: false };

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  getGenericPassword: jest.fn(async (options?: { service?: string }) => {
    if (mockKeychainState.getFails) throw new Error('device locked');
    const password = options?.service && mockKeychain.get(options.service);
    return password ? { username: 'metamask-walletconnect', password } : false;
  }),
  setGenericPassword: jest.fn(
    async (
      _username: string,
      password: string,
      options?: { service?: string },
    ) => {
      if (mockKeychainState.setFails || !options?.service) return false;
      mockKeychain.set(options.service, password);
      return { service: options.service, storage: 'keychain' };
    },
  ),
}));

jest.mock('../../util/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), log: jest.fn() },
}));

jest.mock('../Encryptor', () => {
  class MockEncryptor {
    encrypt = async (password: string, data: unknown) => {
      const delay = mockEncryptDelays.shift() ?? 0;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return JSON.stringify({
        cipher: Buffer.from(JSON.stringify({ password, data })).toString(
          'base64',
        ),
        iv: 'iv',
        salt: 'salt',
      });
    };
    decrypt = async (password: string, text: string) => {
      const payload = JSON.parse(
        Buffer.from(JSON.parse(text).cipher, 'base64').toString(),
      );
      if (payload.password !== password) {
        throw new Error('bad decrypt');
      }
      return payload.data;
    };
  }
  return { Encryptor: MockEncryptor, LEGACY_DERIVATION_OPTIONS: {} };
});

jest.mock('../../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => {
      if (mockStoreState.getFails) throw new Error('storage unavailable');
      return mockStore.get(key) ?? null;
    },
    setItem: async (key: string, value: string) => {
      mockStore.set(key, value);
    },
    removeItem: async (key: string) => {
      mockStore.delete(key);
    },
  },
}));

const session = {
  connected: true,
  key: 'bridge-symmetric-key-0123456789abcdef',
  clientId: 'client-id-1',
  peerId: 'peer-1',
  bridge: 'https://bridge.example.org',
  handshakeTopic: 'topic',
  lastTimeConnected: '2026-10-01T00:00:00.000Z',
};

// Fresh module instance, as after an app restart (drops the cached key).
const loadModule = (): typeof import('./wc-session-storage') => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  return require('./wc-session-storage');
};

describe('wc-session-storage', () => {
  beforeEach(() => {
    mockStore.clear();
    mockKeychain.clear();
    mockKeychainState.setFails = false;
    mockKeychainState.getFails = false;
    mockEncryptDelays.length = 0;
    mockStoreState.getFails = false;
  });

  it('never writes the session key to storage in plaintext', async () => {
    await loadModule().persistWalletConnectSessions([session]);

    const stored = mockStore.get(WALLETCONNECT_SESSIONS) ?? '';
    expect(stored).not.toBe('');
    expect(stored).not.toContain(session.key);
    expect(stored).not.toContain(session.clientId);
    expect(Array.isArray(JSON.parse(stored))).toBe(false);
  });

  it('stores a random key in the Keychain with this-device-only access', async () => {
    const storage = loadModule();
    await storage.persistWalletConnectSessions([session]);

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { setGenericPassword } = require('react-native-keychain');
    expect(setGenericPassword).toHaveBeenCalledTimes(1);
    expect(setGenericPassword).toHaveBeenCalledWith(
      'metamask-walletconnect',
      expect.any(String),
      {
        service: storage.WALLETCONNECT_SESSIONS_KEYCHAIN_SERVICE,
        accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
      },
    );
    const key =
      mockKeychain.get(storage.WALLETCONNECT_SESSIONS_KEYCHAIN_SERVICE) ?? '';
    expect(Buffer.from(key, 'base64')).toHaveLength(32);
  });

  it('restores persisted sessions after a restart', async () => {
    await loadModule().persistWalletConnectSessions([session]);

    expect(await loadModule().loadWalletConnectSessions()).toEqual([session]);
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await loadModule().loadWalletConnectSessions()).toEqual([]);
  });

  it('migrates legacy plaintext sessions to encrypted storage', async () => {
    mockStore.set(WALLETCONNECT_SESSIONS, JSON.stringify([session]));

    expect(await loadModule().loadWalletConnectSessions()).toEqual([session]);
    expect(mockStore.get(WALLETCONNECT_SESSIONS)).not.toContain(session.key);
    expect(await loadModule().loadWalletConnectSessions()).toEqual([session]);
  });

  it('discards sessions that can no longer be decrypted', async () => {
    await loadModule().persistWalletConnectSessions([session]);
    mockKeychain.clear();

    expect(await loadModule().loadWalletConnectSessions()).toEqual([]);
    expect(mockStore.has(WALLETCONNECT_SESSIONS)).toBe(false);
  });

  it('clears storage instead of writing plaintext when the Keychain fails', async () => {
    mockStore.set(WALLETCONNECT_SESSIONS, JSON.stringify([session]));
    mockKeychainState.setFails = true;

    await loadModule().persistWalletConnectSessions([session]);

    expect(mockStore.has(WALLETCONNECT_SESSIONS)).toBe(false);
  });

  it('keeps stored sessions when the Keychain is temporarily unreadable', async () => {
    await loadModule().persistWalletConnectSessions([session]);
    const stored = mockStore.get(WALLETCONNECT_SESSIONS);
    mockKeychainState.getFails = true;

    expect(await loadModule().loadWalletConnectSessions()).toEqual([]);
    expect(mockStore.get(WALLETCONNECT_SESSIONS)).toBe(stored);

    mockKeychainState.getFails = false;
    expect(await loadModule().loadWalletConnectSessions()).toEqual([session]);
  });

  it('keeps encrypted sessions when a later write cannot reach the Keychain', async () => {
    await loadModule().persistWalletConnectSessions([session]);
    const stored = mockStore.get(WALLETCONNECT_SESSIONS);
    mockKeychainState.getFails = true;

    await loadModule().persistWalletConnectSessions([]);

    expect(mockStore.get(WALLETCONNECT_SESSIONS)).toBe(stored);
  });

  it('applies overlapping writes in call order', async () => {
    const other = { ...session, key: 'other-key', peerId: 'peer-2' };
    const storage = loadModule();
    mockEncryptDelays.push(50, 0);

    await Promise.all([
      storage.persistWalletConnectSessions([session]),
      storage.persistWalletConnectSessions([session, other]),
    ]);

    expect(await loadModule().loadWalletConnectSessions()).toEqual([
      session,
      other,
    ]);
  });

  it('merges sessions that could not be restored into the next write', async () => {
    const other = { ...session, key: 'other-key', peerId: 'peer-2' };
    await loadModule().persistWalletConnectSessions([session]);
    const storage = loadModule();
    mockKeychainState.getFails = true;
    expect(await storage.loadWalletConnectSessions()).toEqual([]);

    mockKeychainState.getFails = false;
    await storage.persistWalletConnectSessions([other]);

    expect(await loadModule().loadWalletConnectSessions()).toEqual([
      other,
      session,
    ]);
  });

  it('does not overwrite sessions that could not be read from storage', async () => {
    const other = { ...session, key: 'other-key', peerId: 'peer-2' };
    await loadModule().persistWalletConnectSessions([session]);
    const storage = loadModule();
    mockStoreState.getFails = true;
    expect(await storage.loadWalletConnectSessions()).toEqual([]);

    await storage.persistWalletConnectSessions([other]);
    mockStoreState.getFails = false;
    expect(await loadModule().loadWalletConnectSessions()).toEqual([session]);

    await storage.persistWalletConnectSessions([other]);
    expect(await loadModule().loadWalletConnectSessions()).toEqual([
      other,
      session,
    ]);
  });
});
