import { DetoxCircusEnvironment } from 'detox/runners/jest';

// `detox/runners/jest-circus` ships SpecReporter/WorkerAssignReporter without TypeScript
// declarations, so import via require and treat them as listener factories.
/* eslint-disable @typescript-eslint/no-require-imports, import/no-commonjs */
const {
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus') as {
  SpecReporter: new (...args: unknown[]) => unknown;
  WorkerAssignReporter: new (...args: unknown[]) => unknown;
};

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  // The runtime property `initTimeout` is set on the underlying base class but is
  // not part of the published TypeScript declarations.
  declare protected initTimeout: number;

  constructor(...args: ConstructorParameters<typeof DetoxCircusEnvironment>) {
    super(...args);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 500000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    } as Parameters<DetoxCircusEnvironment['registerListeners']>[0]);
  }
}

export default CustomDetoxEnvironment;
