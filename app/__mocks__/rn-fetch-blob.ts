type Noop = () => Record<string, never>;

const noop: Noop = () => ({});

const rnFetchBlob = {
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
