import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { TARBALL_SIZE_SAFETY_LIMIT } from '@metamask/snaps-controllers';
import { NpmLocation } from './npm';

const EXTRACTION_ROOT = '/cache-dir/snaps-npm/test-uuid';
const PACKAGE_DIR = `${EXTRACTION_ROOT}/contents/package`;

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(() => ({
      flush: jest.fn(),
      data: '/cache-dir/snaps-npm/test-uuid/archive.tgz',
    })),
  })),
  fs: {
    dirs: { DocumentDir: '/document-dir', CacheDir: '/cache-dir' },
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 1024 }),
    unlink: jest.fn().mockResolvedValue(undefined),
    isDir: jest.fn((path) => path.endsWith('package') || path.endsWith('dist')),
    ls: jest.fn((path) => {
      if (path === '/cache-dir/snaps-npm/test-uuid/contents/package') {
        return ['snap.manifest.json', 'dist'];
      } else if (
        path === '/cache-dir/snaps-npm/test-uuid/contents/package/dist'
      ) {
        return ['bundle.js'];
      }
      return [];
    }),
    readFile: jest.fn((path) => {
      if (
        path ===
        '/cache-dir/snaps-npm/test-uuid/contents/package/dist/bundle.js'
      ) {
        return `module.exports.onRpcRequest = () => null`;
      } else if (
        path ===
        '/cache-dir/snaps-npm/test-uuid/contents/package/snap.manifest.json'
      ) {
        return `{ "proposedName": "Example Snap" }`;
      }
      throw new Error('File not found');
    }),
  },
}));

const mockUnTar = NativeModules.RNTar.unTar as jest.Mock;

const mockRegistryFetch = jest.fn(async () => ({
  ok: true,
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
}));

const createLocation = () =>
  new NpmLocation(new URL('npm:@metamask/example-snap'), {
    fetch: mockRegistryFetch as unknown as typeof fetch,
  });

describe('NpmLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnTar.mockResolvedValue(PACKAGE_DIR);
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
  });

  it('extracts into a fresh directory outside the documents directory', async () => {
    const location = createLocation();
    await location.fetch('snap.manifest.json');

    expect(ReactNativeBlobUtil.fs.mkdir).toHaveBeenCalledWith(EXTRACTION_ROOT);
    expect(ReactNativeBlobUtil.config).toHaveBeenCalledWith({
      fileCache: true,
      path: `${EXTRACTION_ROOT}/archive.tgz`,
    });
    expect(mockUnTar).toHaveBeenCalledWith(
      `${EXTRACTION_ROOT}/archive.tgz`,
      `${EXTRACTION_ROOT}/contents`,
    );
    expect(mockUnTar.mock.calls[0][1]).not.toContain('/document-dir');
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(EXTRACTION_ROOT);
  });

  it('rejects tarballs over the size limit without extracting them', async () => {
    (ReactNativeBlobUtil.fs.stat as jest.Mock).mockResolvedValueOnce({
      size: TARBALL_SIZE_SAFETY_LIMIT + 1,
    });
    const location = createLocation();

    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(mockUnTar).not.toHaveBeenCalled();
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(EXTRACTION_ROOT);
  });

  it('cleans up the extraction directory when native extraction fails', async () => {
    mockUnTar.mockRejectedValueOnce(
      new Error('Entry ../escape.txt resolves outside the destination'),
    );
    const location = createLocation();

    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'resolves outside the destination',
    );
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(EXTRACTION_ROOT);
  });
});
