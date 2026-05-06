/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore - detox/runners/jest-circus has no type declarations
import {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
  // @ts-ignore - detox/runners/jest-circus has no type declarations
} from 'detox/runners/jest-circus';

class CustomDetoxEnvironment extends (DetoxCircusEnvironment as any) {
  constructor(config: unknown, context: unknown) {
    super(config, context);

    // Can be safely removed, if you are content with the default value (=300000ms)
    (this as any).initTimeout = 500000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    (this as any).registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

export default CustomDetoxEnvironment;
