import networkOnboardReducer, { initialState } from './index';
import {
  onboardNetworkAction,
  networkSwitched,
  showNetworkOnboardingAction,
} from '../../actions/onboardNetwork';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reduce = (state: any, action: any) => networkOnboardReducer(state, action);

describe('networkOnboardReducer', () => {
  it('returns the initial state', () => {
    expect(networkOnboardReducer(undefined)).toEqual(initialState);
  });

  it('shows network onboarding', () => {
    const state = reduce(
      initialState,
      showNetworkOnboardingAction({
        networkUrl: 'https://rpc',
        networkType: 'rpc',
        nativeToken: 'ETH',
        showNetworkOnboarding: true,
      }),
    );
    expect(state.networkState).toEqual({
      showNetworkOnboarding: true,
      nativeToken: 'ETH',
      networkType: 'rpc',
      networkUrl: 'https://rpc',
    });
  });

  it('records a network switch', () => {
    const state = reduce(
      initialState,
      networkSwitched({ networkUrl: 'https://rpc', networkStatus: true }),
    );
    expect(state.switchedNetwork).toEqual({
      networkUrl: 'https://rpc',
      networkStatus: true,
    });
  });

  it('marks a network as onboarded and resets the network state', () => {
    const shown = reduce(
      initialState,
      showNetworkOnboardingAction({
        networkUrl: 'https://rpc',
        networkType: 'rpc',
        nativeToken: 'ETH',
        showNetworkOnboarding: true,
      }),
    );
    const state = reduce(shown, onboardNetworkAction('0x1'));
    expect(state.networkOnboardedState).toEqual({ '0x1': true });
    expect(state.networkState).toEqual(initialState.networkState);
  });

  it('returns the same state for unknown actions', () => {
    expect(reduce(initialState, { type: 'UNKNOWN' })).toBe(initialState);
  });
});

describe('onboardNetwork actions', () => {
  it('creates actions', () => {
    expect(onboardNetworkAction('0x1')).toEqual({
      type: 'NETWORK_ONBOARDED',
      payload: '0x1',
    });
    expect(
      networkSwitched({ networkUrl: 'u', networkStatus: false }),
    ).toEqual({ type: 'NETWORK_SWITCHED', networkUrl: 'u', networkStatus: false });
  });
});
