// Minimal ambient declarations for `detox/runners/jest-circus` which does not
// ship its own .d.ts file.
declare module 'detox/runners/jest-circus' {
  type UnknownArgs = readonly unknown[];

  type UnknownCtor = new (...args: UnknownArgs) => unknown;

  export const DetoxCircusEnvironment: UnknownCtor;
  export const SpecReporter: UnknownCtor;
  export const WorkerAssignReporter: UnknownCtor;
}
