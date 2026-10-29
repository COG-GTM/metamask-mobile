import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { NpmLocation } from './npm';

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(() => ({
      flush: jest.fn(),
      data: '/cache-dir/archive.tgz',
    })),
  })),
  fs: {
    dirs: { CacheDir: '/cache-dir' },
    exists: jest.fn().mockResolvedValue(true),
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

describe('NpmLocation', () => {
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

  it('extracts into a unique scratch directory and removes it afterwards', async () => {
    const location = new NpmLocation(new URL('npm:@metamask/example-snap'));
    await location.fetch('snap.manifest.json');

    const [archivePath, extractionDir] = (
      NativeModules.RNTar.unTar as jest.Mock
    ).mock.calls.at(-1);
    expect(archivePath).toBe('/cache-dir/archive.tgz');
    expect(extractionDir).toMatch(/^\/cache-dir\/snaps-npm-[0-9a-f-]{36}$/u);
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(extractionDir);
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
      `${extractionDir}.tgz`,
    );
  });
});
