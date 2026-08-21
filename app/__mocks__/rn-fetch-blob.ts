type Noop = () => Record<string, never>;

const noop: Noop = () => ({});

interface RNFetchBlobFsMock {
  writeFile: () => Promise<void>;
  exists: () => Promise<void>;
  mkdir: () => Promise<void>;
  dirs: {
    CacheDir: Noop;
    DocumentDir: Noop;
  };
}

interface RNFetchBlobMock {
  DocumentDir: Noop;
  fetch: Noop;
  base64: Noop;
  android: Noop;
  ios: Noop;
  config: Noop;
  session: Noop;
  fs: RNFetchBlobFsMock;
  wrap: Noop;
}

const rnFetchBlob: RNFetchBlobMock = {
  DocumentDir: noop,
  fetch: noop,
  base64: noop,
  android: noop,
  ios: noop,
  config: noop,
  session: noop,
  fs: {
    writeFile: () => Promise.resolve(),
    exists: () => Promise.resolve(),
    mkdir: () => Promise.resolve(),
    dirs: {
      CacheDir: noop,
      DocumentDir: noop,
    },
  },
  wrap: noop,
};

export default rnFetchBlob;
