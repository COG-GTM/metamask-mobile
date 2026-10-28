import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { TARBALL_SIZE_SAFETY_LIMIT } from '@metamask/snaps-controllers';
import { NpmLocation, TARBALL_ENTRY_LIMIT } from './npm';

const mockFlush = jest.fn();
let mockHeaders: Record<string, string> = {};
let mockProgress: [number, number] | undefined;
const mockCancel = jest.fn();

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(() => {
      let cancelled = false;
      let progressCallback:
        | ((received: number, total: number) => void)
        | undefined;
      const task: Promise<unknown> & {
        progress: jest.Mock;
        cancel: jest.Mock;
      } = Object.assign(
        new Promise((resolve, reject) =>
          setTimeout(() => {
            if (mockProgress && progressCallback) {
              progressCallback(...mockProgress);
            }
            if (cancelled) {
              reject(new Error('canceled'));
            } else {
              resolve({
                flush: mockFlush,
                data: '/document-dir/archive.tgz',
                info: () => ({ headers: mockHeaders }),
              });
            }
          }),
        ),
        {
          progress: jest.fn((_config, callback) => {
            progressCallback = callback;
            return task;
          }),
          cancel: jest.fn(() => {
            cancelled = true;
            mockCancel();
          }),
        },
      );
      return task;
    }),
  })),
  fs: {
    dirs: { DocumentDir: '/document-dir/' },
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 100 }),
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

const mockFs = ReactNativeBlobUtil.fs as jest.Mocked<
  typeof ReactNativeBlobUtil.fs
>;

// Serves the registry metadata so the tests do not hit the network.
const mockRegistryFetch = jest.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    'dist-tags': { latest: '1.0.0' },
    versions: {
      '1.0.0': {
        dist: {
          tarball:
            'https://registry.npmjs.org/@metamask/example-snap/-/example-snap-1.0.0.tgz',
        },
      },
    },
  }),
})) as unknown as typeof fetch;

const createLocation = () =>
  new NpmLocation(new URL('npm:@metamask/example-snap'), {
    fetch: mockRegistryFetch,
  });

const fetchManifest = () => createLocation().fetch('snap.manifest.json');

describe('NpmLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders = {};
    mockProgress = undefined;
    mockFs.stat.mockResolvedValue({ size: 100 } as never);
  });

  // This test is heavily mocked and not necesarily a good indicator that everything works E2E.
  it('fetches and unpacks tarballs', async () => {
    const location = createLocation();
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
    expect(mockFlush).toHaveBeenCalled();
  });

  it('rejects a tarball whose Content-Length exceeds the size limit before extracting it', async () => {
    mockHeaders = { 'Content-Length': String(TARBALL_SIZE_SAFETY_LIMIT + 1) };

    await expect(fetchManifest()).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(NativeModules.RNTar.unTar).not.toHaveBeenCalled();
    expect(mockFlush).toHaveBeenCalled();
  });

  it('rejects a downloaded tarball larger than the size limit before extracting it', async () => {
    mockFs.stat.mockResolvedValueOnce({
      size: TARBALL_SIZE_SAFETY_LIMIT + 1,
    } as never);

    await expect(fetchManifest()).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(NativeModules.RNTar.unTar).not.toHaveBeenCalled();
  });

  it('cancels the download once it exceeds the size limit', async () => {
    mockProgress = [TARBALL_SIZE_SAFETY_LIMIT + 1, -1];

    await expect(fetchManifest()).rejects.toThrow('canceled');
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(NativeModules.RNTar.unTar).not.toHaveBeenCalled();
    expect(mockFs.unlink).toHaveBeenCalledWith('/document-dir//archive.tgz');
  });

  it('rejects extracted files larger than the size limit without reading them', async () => {
    mockFs.stat.mockImplementation(
      async (path: string) =>
        ({
          size: path.endsWith('.tgz') ? 100 : TARBALL_SIZE_SAFETY_LIMIT / 2 + 1,
        } as never),
    );

    await expect(fetchManifest()).rejects.toThrow(
      `Snap tarball exceeds limit of ${TARBALL_SIZE_SAFETY_LIMIT} bytes.`,
    );
    expect(mockFs.readFile).not.toHaveBeenCalled();
    expect(mockFs.unlink).toHaveBeenCalledWith('/document-dir/archive');
  });

  it('rejects extracted files whose size cannot be determined', async () => {
    mockFs.stat.mockImplementation(
      async (path: string) =>
        ({ size: path.endsWith('.tgz') ? 100 : 'unknown' } as never),
    );

    await expect(fetchManifest()).rejects.toThrow(
      `Snap tarball exceeds limit of ${TARBALL_SIZE_SAFETY_LIMIT} bytes.`,
    );
    expect(mockFs.readFile).not.toHaveBeenCalled();
  });

  it('rejects tarballs with too many files without reading them', async () => {
    mockFs.ls.mockImplementationOnce(
      async () =>
        Array.from(
          { length: TARBALL_ENTRY_LIMIT + 1 },
          (_, i) => `file${i}.js`,
        ) as never,
    );

    await expect(fetchManifest()).rejects.toThrow(
      `Snap tarball exceeds limit of ${TARBALL_ENTRY_LIMIT} files.`,
    );
    expect(mockFs.readFile).not.toHaveBeenCalled();
    expect(mockFs.unlink).toHaveBeenCalledWith('/document-dir/archive');
  });
});
