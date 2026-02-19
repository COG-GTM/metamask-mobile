interface RnFetchBlobFsDirs {
  CacheDir: () => Record<string, never>;
  DocumentDir: () => Record<string, never>;
}

interface RnFetchBlobFs {
  writeFile: () => Promise<void>;
  exists: () => Promise<void>;
  mkdir: () => Promise<void>;
  dirs: RnFetchBlobFsDirs;
}

interface RnFetchBlobMock {
  DocumentDir: () => Record<string, never>;
  fetch: () => Record<string, never>;
  base64: () => Record<string, never>;
  android: () => Record<string, never>;
  ios: () => Record<string, never>;
  config: () => Record<string, never>;
  session: () => Record<string, never>;
  fs: RnFetchBlobFs;
  wrap: () => Record<string, never>;
}

const noop = (): Record<string, never> => ({});

const rnFetchBlobMock: RnFetchBlobMock = {
  DocumentDir: noop,
  fetch: noop,
  base64: noop,
  android: noop,
  ios: noop,
  config: noop,
  session: noop,
  fs: {
    writeFile: (): Promise<void> => Promise.resolve(),
    exists: (): Promise<void> => Promise.resolve(),
    mkdir: (): Promise<void> => Promise.resolve(),
    dirs: {
      CacheDir: noop,
      DocumentDir: noop,
    },
  },
  wrap: noop,
};

export default rnFetchBlobMock;
