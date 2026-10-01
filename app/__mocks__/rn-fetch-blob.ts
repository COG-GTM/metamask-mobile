const noop = (): Record<string, unknown> => ({});

export default {
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
