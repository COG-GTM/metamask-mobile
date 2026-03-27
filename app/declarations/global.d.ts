// Augment globalThis so that `global.ErrorUtils` is recognized by TypeScript.
// `@types/react-native` declares ErrorUtils with `const` inside `declare global`,
// which does not appear on `typeof globalThis`. Re-declaring with `var` adds it.
/* eslint-disable no-var */
declare var ErrorUtils: {
  getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler: (
    handler: (error: Error, isFatal: boolean) => void,
  ) => void;
};
