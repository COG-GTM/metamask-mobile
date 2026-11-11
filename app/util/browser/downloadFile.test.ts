import { Alert, AlertButton, Linking } from 'react-native';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Device from '../device';
import downloadFile, { MAX_DOWNLOAD_BYTES } from './downloadFile';

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(),
  fs: {
    dirs: { CacheDir: '/cache', DocumentDir: '/docs' },
    unlink: jest.fn(),
    stat: jest.fn(),
  },
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('../device', () => ({
  isIos: jest.fn(),
}));

const PKPASS = 'application/vnd.apple.pkpass';
const DOWNLOAD_URL = 'https://attacker.example/pass.pkpass';
const CACHE_PATH_PREFIX = '/cache/browser-downloads/';

type ProgressCallback = (received: number, total: number) => void;

interface MockTask {
  config: jest.Mock;
  fetch: jest.Mock;
  cancel: jest.Mock;
  emitProgress: ProgressCallback;
  resolve: () => void;
  reject: (err: unknown) => void;
}

const mockFetchTask = (contentType: string): MockTask => {
  let onProgress: ProgressCallback = () => undefined;
  let resolve: () => void = () => undefined;
  let reject: (err: unknown) => void = () => undefined;
  const response = {
    respInfo: { headers: { 'Content-Type': contentType } },
    path: () => '/cache/browser-downloads/file',
    text: () => '',
  };
  const cancel = jest.fn(() => reject(new Error('canceled')));
  const fetchMock = jest.fn(() => {
    const promise = new Promise((res, rej) => {
      resolve = () => res(response);
      reject = rej;
    }) as Promise<unknown> & {
      progress: jest.Mock;
      cancel: jest.Mock;
    };
    promise.progress = jest.fn((_config, cb: ProgressCallback) => {
      onProgress = cb;
      return promise;
    });
    promise.cancel = cancel;
    return promise;
  });
  const config = ReactNativeBlobUtil.config as jest.Mock;
  config.mockReturnValue({ fetch: fetchMock });
  return {
    config,
    fetch: fetchMock,
    cancel,
    emitProgress: (received, total) => onProgress(received, total),
    resolve: () => resolve(),
    reject: (err) => reject(err),
  };
};

const flush = () => new Promise(process.nextTick);

const alertCall = (index: number) =>
  (Alert.alert as jest.Mock).mock.calls[index];

const pressAlertButton = (index: number, style: AlertButton['style']) => {
  const buttons = alertCall(index)[2] as AlertButton[];
  buttons.find((button) => button.style === style)?.onPress?.();
};

const cachePathOf = (task: MockTask) => task.config.mock.calls[0][0].path;

describe('downloadFile', () => {
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    (Device.isIos as jest.Mock).mockReturnValue(true);
    (ReactNativeBlobUtil.fs.stat as jest.Mock).mockResolvedValue({
      size: 1024,
    });
    (ReactNativeBlobUtil.fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (Share.open as jest.Mock).mockResolvedValue({
      success: true,
      message: 'shared',
    });
  });

  const startConfirmedDownload = async (
    contentType: string,
    url = DOWNLOAD_URL,
  ) => {
    const task = mockFetchTask(contentType);
    const pending = downloadFile(url);
    await flush();
    pressAlertButton(0, 'default');
    await flush();
    return { task, pending };
  };

  describe('consent prompt', () => {
    it('asks the user, showing the host, before fetching anything', async () => {
      const task = mockFetchTask('application/pdf');

      const pending = downloadFile(DOWNLOAD_URL);
      await flush();

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(alertCall(0)[1]).toContain('attacker.example');
      expect(task.fetch).not.toHaveBeenCalled();

      pressAlertButton(0, 'default');
      await flush();
      expect(task.fetch).toHaveBeenCalledWith('GET', DOWNLOAD_URL);
      task.resolve();

      await expect(pending).resolves.toEqual({
        success: true,
        message: 'shared',
        cancelled: false,
      });
    });

    it('never fetches when the user declines', async () => {
      const task = mockFetchTask('application/pdf');

      const pending = downloadFile(DOWNLOAD_URL);
      await flush();
      pressAlertButton(0, 'cancel');

      const result = await pending;
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(task.fetch).not.toHaveBeenCalled();
      expect(Share.open).not.toHaveBeenCalled();
    });

    it('never fetches when the prompt is dismissed', async () => {
      const task = mockFetchTask('application/pdf');

      const pending = downloadFile(DOWNLOAD_URL);
      await flush();
      alertCall(0)[3].onDismiss();

      expect((await pending).cancelled).toBe(true);
      expect(task.fetch).not.toHaveBeenCalled();
    });

    it('rejects non-http(s) download URLs without prompting', async () => {
      const task = mockFetchTask('application/pdf');

      const result = await downloadFile('file:///etc/passwd');

      expect(result.success).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(task.fetch).not.toHaveBeenCalled();
    });
  });

  describe('storage', () => {
    it('writes to the caches folder, not Documents', async () => {
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.resolve();
      await pending;

      expect(cachePathOf(task).startsWith(CACHE_PATH_PREFIX)).toBe(true);
      expect(task.config.mock.calls[0][0].fileCache).toBeUndefined();
    });

    it('deletes the cached file after the share sheet closes', async () => {
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.resolve();
      await pending;

      const path = cachePathOf(task);
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({ url: path }),
      );
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(path);
      const shareOrder = (Share.open as jest.Mock).mock.invocationCallOrder[0];
      const unlinkOrder = (ReactNativeBlobUtil.fs.unlink as jest.Mock).mock
        .invocationCallOrder[0];
      expect(unlinkOrder).toBeGreaterThan(shareOrder);
    });

    it('reports a dismissed share sheet as cancelled and still deletes the file', async () => {
      (Share.open as jest.Mock).mockResolvedValue({
        success: false,
        message: 'dismissed',
        dismissedAction: true,
      });
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.resolve();

      expect(await pending).toEqual({
        success: false,
        message: 'dismissed',
        cancelled: true,
      });
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });

    it('deletes the cached file when sharing fails', async () => {
      (Share.open as jest.Mock).mockRejectedValue(new Error('share failed'));
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.resolve();

      expect(await pending).toEqual({
        success: false,
        message: 'share failed',
      });
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });

    it('deletes the partial file when the request fails', async () => {
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.reject(new Error('network down'));

      expect((await pending).message).toBe('network down');
      expect(Share.open).not.toHaveBeenCalled();
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });
  });

  describe('size limit', () => {
    it('cancels as soon as the received bytes exceed the limit', async () => {
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.emitProgress(MAX_DOWNLOAD_BYTES / 2, -1);
      expect(task.cancel).not.toHaveBeenCalled();
      task.emitProgress(MAX_DOWNLOAD_BYTES + 1, -1);

      const result = await pending;
      expect(task.cancel).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.cancelled).toBeUndefined();
      expect(Share.open).not.toHaveBeenCalled();
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });

    it('cancels immediately when the declared size exceeds the limit', async () => {
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.emitProgress(10, MAX_DOWNLOAD_BYTES * 10);

      expect((await pending).success).toBe(false);
      expect(task.cancel).toHaveBeenCalledTimes(1);
      expect(Share.open).not.toHaveBeenCalled();
    });

    it('refuses a finished file larger than the limit', async () => {
      (ReactNativeBlobUtil.fs.stat as jest.Mock).mockResolvedValue({
        size: MAX_DOWNLOAD_BYTES + 1,
      });
      const { task, pending } = await startConfirmedDownload('application/pdf');
      task.resolve();

      expect((await pending).success).toBe(false);
      expect(Share.open).not.toHaveBeenCalled();
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });
  });

  describe('Apple Wallet pass on iOS', () => {
    it('asks the user before opening the pass URL outside MetaMask', async () => {
      const { task, pending } = await startConfirmedDownload(PKPASS);
      task.resolve();
      await flush();
      await flush();

      expect(Alert.alert).toHaveBeenCalledTimes(2);
      expect(alertCall(1)[1]).toContain('attacker.example');
      expect(openURLSpy).not.toHaveBeenCalled();

      pressAlertButton(1, 'default');

      await expect(pending).resolves.toEqual({
        success: true,
        message: 'success',
      });
      expect(openURLSpy).toHaveBeenCalledWith(DOWNLOAD_URL);
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        cachePathOf(task),
      );
    });

    it('does not open the URL when the user ignores the prompt', async () => {
      const { task, pending } = await startConfirmedDownload(PKPASS);
      task.resolve();
      await flush();
      await flush();
      pressAlertButton(1, 'cancel');

      const result = await pending;
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(openURLSpy).not.toHaveBeenCalled();
      expect(Share.open).not.toHaveBeenCalled();
    });

    it('shares pkpass downloads on Android instead of opening the URL', async () => {
      (Device.isIos as jest.Mock).mockReturnValue(false);
      const { task, pending } = await startConfirmedDownload(PKPASS);
      task.resolve();
      await pending;

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(openURLSpy).not.toHaveBeenCalled();
      expect(Share.open).toHaveBeenCalled();
    });
  });
});
