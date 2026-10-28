import engineReducer, { initBgState, updateBgState } from '.';

jest.mock('../../../Engine', () => ({
  init: () => jest.requireActual('../../../Engine').default.init({}),
  state: {},
}));
// importing Engine after mocking to avoid global mock from overwriting its values
import Engine from '../../../Engine';

describe('engineReducer', () => {
  it('should return the initial state in default', () => {
    jest.isolateModules(() => {
      jest.mock('../../../Engine', () => ({
        init: () => jest.requireActual('../../../Engine').default.init({}),
        state: {},
      }));
    });

    const initialStatDefault = { backgroundState: {} };
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextState = engineReducer(undefined, {} as any);
    expect(nextState).toEqual(initialStatDefault);
  });

  it('should initialize backgroundState when dispatching INIT_BG_STATE action', () => {
    const initialState = { backgroundState: {} };
    const nextState = engineReducer(initialState, initBgState());
    expect(nextState).toEqual({ backgroundState: Engine.state });
  });

  it('should update backgroundState when dispatching UPDATE_BG_STATE action', () => {
    const reduxInitialState = {
      backgroundState: {
        AccountTrackerController: {},
      },
    };

    const key = 'AccountTrackerController';
    // changing the mock version to suit this test manually due to our current global mock
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Engine as any).state = {
      AccountTrackerController: { accounts: 'testValue' },
    };
    const { backgroundState } = engineReducer(
      reduxInitialState,
      updateBgState({ key }),
    );
    expect(backgroundState).toEqual({
      ...reduxInitialState.backgroundState,
      AccountTrackerController: Engine.state[key],
    });
  });

  it('updates every key of a batched UPDATE_BG_STATE action from one Engine.state read', () => {
    const engineState = {
      AccountTrackerController: { accounts: 'a' },
      TokenRatesController: { marketData: 'b' },
      NetworkController: { selectedNetworkClientId: 'c' },
    };
    const stateGetter = jest.fn(() => engineState);
    Object.defineProperty(Engine, 'state', {
      get: stateGetter,
      configurable: true,
    });
    const reduxInitialState = {
      backgroundState: {
        AccountTrackerController: {},
        TokenRatesController: {},
        NetworkController: { selectedNetworkClientId: 'old' },
        KeyringController: { vault: 'unchanged' },
      },
    };

    const { backgroundState } = engineReducer(
      reduxInitialState,
      updateBgState({
        keys: ['AccountTrackerController', 'TokenRatesController'],
      }),
    );

    expect(stateGetter).toHaveBeenCalledTimes(1);
    expect(backgroundState).toEqual({
      AccountTrackerController: engineState.AccountTrackerController,
      TokenRatesController: engineState.TokenRatesController,
      NetworkController: { selectedNetworkClientId: 'old' },
      KeyringController: { vault: 'unchanged' },
    });
  });
});
