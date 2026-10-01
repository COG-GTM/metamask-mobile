import {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} from 'detox/runners/jest-circus';

interface DetoxEnvironmentBase {
  initTimeout: number;
  registerListeners(listeners: Record<string, unknown>): void;
}

const BaseEnvironment = DetoxCircusEnvironment as new (
  config: unknown,
  context: unknown,
) => DetoxEnvironmentBase;

class CustomDetoxEnvironment extends BaseEnvironment {
  constructor(config: unknown, context: unknown) {
    super(config, context);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 500000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

export default CustomDetoxEnvironment;
