import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { TARBALL_SIZE_SAFETY_LIMIT } from '@metamask/snaps-controllers';
import { MAX_TARBALL_ENTRIES, NpmLocation } from './npm';

const mockProgress = jest.fn();
const mockCancel = jest.fn();

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(() => {
      const task = Promise.resolve({
        flush: jest.fn(),
        data: '/document-dir/archive.tgz',
      });
      return Object.assign(task, {
        progress: mockProgress,
        cancel: mockCancel,
      });
    }),
  })),
  fs: {
    dirs: { DocumentDir: '/document-dir' },
    unlink: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 1024 }),
    isDir: jest.fn((path) => path.endsWith('archive') || path.endsWith('dist')),
    ls: jest.fn((path) => {
      if (path === '/document-dir/archive') {
        return ['snap.manifest.json', 'dist'];
      } else if (path === '/document-dir/archive/dist') {
        return ['bundle.js'];
      }
      return [];
    }),
    readFile: jest.fn((path) => {
      if (path === '/document-dir/archive/dist/bundle.js') {
        return `module.exports.onRpcRequest = () => null`;
      } else if (path === '/document-dir/archive/snap.manifest.json') {
        return `{ "proposedName": "Example Snap" }`;
      }
      throw new Error('File not found');
    }),
  },
}));

const EXTRACTION_DIR_REGEX = /^\/document-dir\/snaps-npm\/[0-9a-f-]{36}$/u;

describe('NpmLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // This test is heavily mocked and not necesarily a good indicator that everything works E2E.
  it('fetches and unpacks tarballs', async () => {
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    const manifest = await location.fetch('snap.manifest.json');
    expect(manifest.path).toStrictEqual('snap.manifest.json');
    expect(manifest.toString()).toStrictEqual(
      `{ "proposedName": "Example Snap" }`,
    );

    const bundle = await location.fetch('dist/bundle.js');
    expect(bundle.path).toStrictEqual('dist/bundle.js');
    expect(bundle.toString()).toStrictEqual(
      `module.exports.onRpcRequest = () => null`,
    );
  });

  it('extracts into a dedicated directory and removes it afterwards', async () => {
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await location.fetch('snap.manifest.json');

    const [archivePath, extractionDir] = (
      NativeModules.RNTar.unTar as jest.Mock
    ).mock.calls[0];
    expect(extractionDir).toMatch(EXTRACTION_DIR_REGEX);
    expect(extractionDir).not.toBe('/document-dir');
    expect(archivePath).toBe('/document-dir/archive.tgz');
    expect(ReactNativeBlobUtil.config).toHaveBeenCalledWith({
      fileCache: true,
      path: `${extractionDir}.tgz`,
    });
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(extractionDir);
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
      `${extractionDir}.tgz`,
    );
  });

  it('creates the snaps-npm base directory before downloading', async () => {
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await location.fetch('snap.manifest.json');

    expect(ReactNativeBlobUtil.fs.mkdir).toHaveBeenCalledWith(
      '/document-dir/snaps-npm',
    );
    const mkdirOrder = (ReactNativeBlobUtil.fs.mkdir as jest.Mock).mock
      .invocationCallOrder[0];
    const fetchOrder = (ReactNativeBlobUtil.config as jest.Mock).mock
      .invocationCallOrder[0];
    expect(mkdirOrder).toBeLessThan(fetchOrder);
  });

  it('rejects tarballs larger than TARBALL_SIZE_SAFETY_LIMIT without extracting', async () => {
    (ReactNativeBlobUtil.fs.stat as jest.Mock).mockResolvedValueOnce({
      size: TARBALL_SIZE_SAFETY_LIMIT + 1,
    });
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(NativeModules.RNTar.unTar).not.toHaveBeenCalled();
  });

  it('cancels the download once it exceeds TARBALL_SIZE_SAFETY_LIMIT', async () => {
    mockProgress.mockImplementationOnce((callback) => {
      callback(String(TARBALL_SIZE_SAFETY_LIMIT + 1), '-1');
    });
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(mockCancel).toHaveBeenCalled();
    expect(NativeModules.RNTar.unTar).not.toHaveBeenCalled();
  });

  it('removes the extraction directory when native extraction fails', async () => {
    (NativeModules.RNTar.unTar as jest.Mock).mockRejectedValueOnce(
      new Error('Tarball entry is outside of the target directory'),
    );
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'outside of the target directory',
    );
    const [, extractionDir] = (NativeModules.RNTar.unTar as jest.Mock).mock
      .calls[0];
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(extractionDir);
  });

  it('rejects tarballs with too many entries', async () => {
    (ReactNativeBlobUtil.fs.ls as jest.Mock).mockImplementationOnce(() =>
      Array.from({ length: MAX_TARBALL_ENTRIES + 1 }, (_, i) => `file${i}`),
    );
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      `exceeds limit of ${MAX_TARBALL_ENTRIES} entries`,
    );
  });
});
