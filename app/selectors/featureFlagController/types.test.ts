import type { StateWithPartialEngine } from './types';

describe('featureFlagController types', () => {
  it('StateWithPartialEngine supports partial engine state', () => {
    const state: StateWithPartialEngine = {
      engine: {
        backgroundState: {},
      },
    } as any;
    expect(state.engine.backgroundState).toBeDefined();
  });

  it('StateWithPartialEngine supports full state shape', () => {
    const state: StateWithPartialEngine = {
      engine: {
        backgroundState: {
          NetworkController: {} as any,
        },
      },
    } as any;
    expect(state.engine.backgroundState).toBeDefined();
  });
});
