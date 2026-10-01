import { AppState } from 'react-native';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import ClipboardManager, { PENDING_CLEAR_HASH_KEY } from './ClipboardManager';
import StorageWrapper from '../store/storage-wrapper';
import Device from '../util/device';

jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(),
  setString: jest.fn(),
  setStringExpire: jest.fn(),
  setStringSensitive: jest.fn(),
  clearString: jest.fn(),
}));

jest.mock('../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../util/device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn(),
}));

const mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>;
const mockStorage = StorageWrapper as jest.Mocked<typeof StorageWrapper>;
const mockDevice = Device as jest.Mocked<typeof Device>;

const SECRET = 'lazy zoo apple banana cat dog elephant frog grape house ice jam';
const hashOf = (value: string) => bytesToHex(sha256(utf8ToBytes(value)));

// Flush enough microtask ticks for the chained promises inside the async
// clear/startup handlers to settle.
const flushPromises = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

describe('ClipboardManager', () => {
  let appStateCallback: (state: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state between tests
    ClipboardManager.expireTime = null;
    ClipboardManager.appStateSubscription = null;
    ClipboardManager.trackedHash = null;
    // Restore the (mutable) native method between tests
    mockClipboard.setStringSensitive = jest.fn();

    mockDevice.isIos.mockReturnValue(false);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => {
      appStateCallback = cb as (state: string) => void;
      return { remove: jest.fn() } as unknown as ReturnType<
        typeof AppState.addEventListener
      >;
    });
  });

  describe('setStringExpire on iOS', () => {
    it('uses the native expiring pasteboard and does not persist a marker', async () => {
      mockDevice.isIos.mockReturnValue(true);

      await ClipboardManager.setStringExpire(SECRET);

      expect(mockClipboard.setStringExpire).toHaveBeenCalledWith(SECRET);
      expect(mockClipboard.setStringSensitive).not.toHaveBeenCalled();
      expect(mockStorage.setItem).not.toHaveBeenCalled();
      expect(ClipboardManager.trackedHash).toBeNull();
    });
  });

  describe('setStringExpire on Android', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('writes a sensitive clip, persists a hashed marker and registers a listener', async () => {
      await ClipboardManager.setStringExpire(SECRET);

      expect(mockClipboard.setStringSensitive).toHaveBeenCalledWith(SECRET);
      expect(mockClipboard.setString).not.toHaveBeenCalled();
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
        hashOf(SECRET),
      );
      // The marker is a one-way hash, never the secret itself
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
        SECRET,
      );
      expect(ClipboardManager.trackedHash).toBe(hashOf(SECRET));
      expect(AppState.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('falls back to a plain write when sensitive API is unavailable', async () => {
      mockClipboard.setStringSensitive =
        undefined as unknown as typeof mockClipboard.setStringSensitive;

      await ClipboardManager.setStringExpire(SECRET);

      expect(mockClipboard.setString).toHaveBeenCalledWith(SECRET);
    });

    it('clears the clipboard when the timer fires and content still matches', async () => {
      mockClipboard.getString.mockResolvedValue(SECRET);

      await ClipboardManager.setStringExpire(SECRET);
      jest.runOnlyPendingTimers();
      await flushPromises();

      expect(mockClipboard.clearString).toHaveBeenCalled();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
      );
    });

    it('does not clear the clipboard when content changed before expiry', async () => {
      mockClipboard.getString.mockResolvedValue('something the user copied');

      await ClipboardManager.setStringExpire(SECRET);
      jest.runOnlyPendingTimers();
      await flushPromises();

      expect(mockClipboard.clearString).not.toHaveBeenCalled();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
      );
    });
  });

  describe('foreground clearing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('clears the tracked secret when the app returns to the foreground', async () => {
      mockClipboard.getString.mockResolvedValue(SECRET);

      await ClipboardManager.setStringExpire(SECRET);
      appStateCallback('active');
      await flushPromises();

      expect(mockClipboard.clearString).toHaveBeenCalled();
    });

    it('ignores foreground events when nothing is tracked', async () => {
      await ClipboardManager.setStringExpire(SECRET);
      ClipboardManager.trackedHash = null;

      appStateCallback('active');
      await flushPromises();

      expect(mockClipboard.clearString).not.toHaveBeenCalled();
    });
  });

  describe('handleStartup', () => {
    it('clears a persisted secret that survived process death', async () => {
      mockStorage.getItem.mockResolvedValue(hashOf(SECRET));
      mockClipboard.getString.mockResolvedValue(SECRET);

      await ClipboardManager.handleStartup();

      expect(mockClipboard.clearString).toHaveBeenCalled();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
      );
    });

    it('does not clear unrelated clipboard content on startup', async () => {
      mockStorage.getItem.mockResolvedValue(hashOf(SECRET));
      mockClipboard.getString.mockResolvedValue('unrelated content');

      await ClipboardManager.handleStartup();

      expect(mockClipboard.clearString).not.toHaveBeenCalled();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        PENDING_CLEAR_HASH_KEY,
      );
    });

    it('does nothing when there is no pending marker', async () => {
      mockStorage.getItem.mockResolvedValue(null);

      await ClipboardManager.handleStartup();

      expect(mockClipboard.getString).not.toHaveBeenCalled();
      expect(mockClipboard.clearString).not.toHaveBeenCalled();
    });
  });
});
