import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { TARBALL_SIZE_SAFETY_LIMIT } from '@metamask/snaps-controllers';
import { SemVerRange } from '@metamask/utils';
import { NpmLocation } from './npm';

const mockFlush = jest.fn();

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(() => ({
      flush: mockFlush,
      data: '/document-dir/archive.tgz',
    })),
  })),
  fs: {
    dirs: { DocumentDir: '/document-dir/' },
    stat: jest.fn().mockResolvedValue({ size: 1024 }),
    unlink: jest.fn().mockResolvedValue(undefined),
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

// A pinned version resolves the tarball URL without querying the npm registry.
const createLocation = () =>
  new NpmLocation(new URL('npm:@metamask/example-snap'), {
    versionRange: '1.0.0' as SemVerRange,
  });

describe('NpmLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('rejects tarballs larger than TARBALL_SIZE_SAFETY_LIMIT without extracting them', async () => {
    jest
      .mocked(ReactNativeBlobUtil.fs.stat)
      .mockResolvedValueOnce({ size: TARBALL_SIZE_SAFETY_LIMIT + 1 } as never);
    const unTarSpy = jest.spyOn(NativeModules.RNTar, 'unTar');

    const location = createLocation();
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'Snap tarball exceeds size limit',
    );
    expect(unTarSpy).not.toHaveBeenCalled();
    expect(mockFlush).toHaveBeenCalledTimes(1);
  });

  it('removes the downloaded tarball when extraction fails', async () => {
    jest
      .spyOn(NativeModules.RNTar, 'unTar')
      .mockRejectedValueOnce(new Error('Malformed tar header at offset 0'));

    const location = createLocation();
    await expect(location.fetch('snap.manifest.json')).rejects.toThrow(
      'Malformed tar header at offset 0',
    );
    expect(mockFlush).toHaveBeenCalledTimes(1);
  });
});
