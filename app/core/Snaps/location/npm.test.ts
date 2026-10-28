import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { SemVerRange } from '@metamask/utils';
import { NpmLocation } from './npm';

const WORK_DIR_PATTERN = /^\/cache-dir\/snaps-npm\/[0-9a-f-]{36}$/;

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(({ path }) => ({
    fetch: jest.fn(() => ({
      flush: jest.fn(),
      data: path,
    })),
  })),
  fs: {
    dirs: { DocumentDir: '/document-dir', CacheDir: '/cache-dir' },
    mkdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    isDir: jest.fn(
      (path: string) => path.endsWith('/package') || path.endsWith('/dist'),
    ),
    ls: jest.fn((path: string) => {
      if (path.endsWith('/extracted/package')) {
        return ['snap.manifest.json', 'dist'];
      } else if (path.endsWith('/extracted/package/dist')) {
        return ['bundle.js'];
      }
      return [];
    }),
    readFile: jest.fn((path: string) => {
      if (path.endsWith('/extracted/package/dist/bundle.js')) {
        return `module.exports.onRpcRequest = () => null`;
      } else if (path.endsWith('/extracted/package/snap.manifest.json')) {
        return `{ "proposedName": "Example Snap" }`;
      }
      throw new Error('File not found');
    }),
  },
}));

// A static version skips the npm metadata request, so only the tarball path is exercised.
const createLocation = (packageName = '@metamask/example-snap') =>
  new NpmLocation(new URL(`npm:${packageName}`), {
    versionRange: '1.0.0' as SemVerRange,
  });

const mockUnTar = NativeModules.RNTar.unTar as jest.Mock;
const mockMkdir = ReactNativeBlobUtil.fs.mkdir as jest.Mock;
const mockUnlink = ReactNativeBlobUtil.fs.unlink as jest.Mock;

describe('NpmLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnTar.mockImplementation(
      async (_archive: string, target: string) => `${target}/package`,
    );
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

  it('extracts into a fresh dedicated directory outside of DocumentDir', async () => {
    await createLocation().fetch('snap.manifest.json');

    expect(mockMkdir).toHaveBeenCalledTimes(1);
    const workDir = mockMkdir.mock.calls[0][0];
    expect(workDir).toMatch(WORK_DIR_PATTERN);
    expect(mockUnTar).toHaveBeenCalledWith(
      `${workDir}/archive.tgz`,
      `${workDir}/extracted`,
    );
    for (const [archive, target] of mockUnTar.mock.calls) {
      expect(archive.startsWith('/document-dir')).toBe(false);
      expect(target.startsWith('/document-dir')).toBe(false);
    }
    expect(mockUnlink).toHaveBeenCalledWith(workDir);
  });

  it('uses a different directory for every tarball', async () => {
    await createLocation().fetch('snap.manifest.json');
    await createLocation('@metamask/other-snap').fetch('snap.manifest.json');

    const [[first], [second]] = mockMkdir.mock.calls;
    expect(first).not.toStrictEqual(second);
  });

  it('removes the extraction directory when extraction fails', async () => {
    mockUnTar.mockRejectedValueOnce(
      new Error('Tar entry ../escape.txt is outside of the target directory'),
    );

    await expect(createLocation().fetch('snap.manifest.json')).rejects.toThrow(
      'outside of the target directory',
    );

    const workDir = mockMkdir.mock.calls[0][0];
    expect(workDir).toMatch(WORK_DIR_PATTERN);
    expect(mockUnlink).toHaveBeenCalledWith(workDir);
  });
});
