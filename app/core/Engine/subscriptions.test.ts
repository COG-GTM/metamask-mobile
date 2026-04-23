import { NetworkStatus } from '@metamask/network-controller';
import { setupEngineSubscriptions } from './subscriptions';
import type { SetupEngineSubscriptionsArgs } from './subscriptions';
import NotificationManager from '../NotificationManager';
import AppConstants from '../AppConstants';
import { store } from '../../store';
import {
  networkIdUpdated,
  networkIdWillUpdate,
} from '../../core/redux/slices/inpageProvider';
import { deprecatedGetNetworkId } from '../../util/networks/engineNetworkUtils';
import { getGlobalChainId } from '../../util/networks/global-network';

jest.mock('../NotificationManager', () => ({
  __esModule: true,
  default: {
    gotIncomingTransaction: jest.fn(),
  },
}));

jest.mock('../../store', () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

jest.mock('../../core/redux/slices/inpageProvider', () => ({
  networkIdUpdated: jest.fn((v: string) => ({ type: 'networkIdUpdated', payload: v })),
  networkIdWillUpdate: jest.fn(() => ({ type: 'networkIdWillUpdate' })),
}));

jest.mock('../../util/networks/engineNetworkUtils', () => ({
  deprecatedGetNetworkId: jest.fn(),
}));

jest.mock('../../util/networks/global-network', () => ({
  getGlobalChainId: jest.fn(),
}));

jest.mock('../Permissions/constants', () => ({
  RestrictedMethods: {
    snap_dialog: 'snap_dialog',
  },
}));

type SubscribeCall = [string, (...args: unknown[]) => void];

function buildMockArgs(
  overrides?: Partial<SetupEngineSubscriptionsArgs>,
): SetupEngineSubscriptionsArgs {
  return {
    controllerMessenger: {
      subscribe: jest.fn(),
    } as unknown as SetupEngineSubscriptionsArgs['controllerMessenger'],
    networkController: {
      name: 'NetworkController',
    } as unknown as SetupEngineSubscriptionsArgs['networkController'],
    approvalController: {
      state: { pendingApprovals: {} },
      reject: jest.fn(),
    } as unknown as SetupEngineSubscriptionsArgs['approvalController'],
    currentChainIdRef: { value: '0x1' },
    configureControllersOnNetworkChange: jest.fn(),
    snapController: { name: 'SnapController' },
    ...overrides,
  };
}

describe('setupEngineSubscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes to incoming transactions', () => {
    const args = buildMockArgs();
    setupEngineSubscriptions(args);

    const subscribeCalls = (args.controllerMessenger.subscribe as jest.Mock)
      .mock.calls as SubscribeCall[];
    const incomingTxCall = subscribeCalls.find(
      ([event]) => event === 'TransactionController:incomingTransactionsReceived',
    );
    expect(incomingTxCall).toBeDefined();

    // Invoke the callback
    const mockTxs = [{ id: 'tx1' }];
    incomingTxCall![1](mockTxs);
    expect(NotificationManager.gotIncomingTransaction).toHaveBeenCalledWith(mockTxs);
  });

  it('subscribes to network state change and updates chain ID', () => {
    const args = buildMockArgs();
    (getGlobalChainId as jest.Mock).mockReturnValue('0x5');

    setupEngineSubscriptions(args);

    const subscribeCalls = (args.controllerMessenger.subscribe as jest.Mock)
      .mock.calls as SubscribeCall[];
    const networkChangeCalls = subscribeCalls.filter(
      ([event]) => event === AppConstants.NETWORK_STATE_CHANGE_EVENT,
    );

    // First network state change subscription handles controller reconfiguration
    expect(networkChangeCalls.length).toBeGreaterThanOrEqual(2);

    const configCallback = networkChangeCalls[0][1];
    configCallback({
      networksMetadata: { 'client-1': { status: NetworkStatus.Available } },
      selectedNetworkClientId: 'client-1',
    });

    jest.advanceTimersByTime(500);
    expect(args.configureControllersOnNetworkChange).toHaveBeenCalled();
    expect(args.currentChainIdRef.value).toBe('0x5');
  });

  it('does not reconfigure controllers when chain ID has not changed', () => {
    const args = buildMockArgs();
    (getGlobalChainId as jest.Mock).mockReturnValue('0x1');

    setupEngineSubscriptions(args);

    const subscribeCalls = (args.controllerMessenger.subscribe as jest.Mock)
      .mock.calls as SubscribeCall[];
    const networkChangeCalls = subscribeCalls.filter(
      ([event]) => event === AppConstants.NETWORK_STATE_CHANGE_EVENT,
    );

    const configCallback = networkChangeCalls[0][1];
    configCallback({
      networksMetadata: { 'client-1': { status: NetworkStatus.Available } },
      selectedNetworkClientId: 'client-1',
    });

    jest.advanceTimersByTime(500);
    expect(args.configureControllersOnNetworkChange).not.toHaveBeenCalled();
  });

  it('dispatches networkIdUpdated on network state change', async () => {
    const args = buildMockArgs();
    (deprecatedGetNetworkId as jest.Mock).mockResolvedValue('1');

    setupEngineSubscriptions(args);

    const subscribeCalls = (args.controllerMessenger.subscribe as jest.Mock)
      .mock.calls as SubscribeCall[];
    const networkChangeCalls = subscribeCalls.filter(
      ([event]) => event === AppConstants.NETWORK_STATE_CHANGE_EVENT,
    );

    // Second subscription dispatches networkIdUpdated
    const networkIdCallback = networkChangeCalls[1][1];
    await networkIdCallback();

    expect(deprecatedGetNetworkId).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      networkIdUpdated('1'),
    );
  });

  it('dispatches networkIdWillUpdate on networkWillChange', () => {
    const args = buildMockArgs();
    setupEngineSubscriptions(args);

    const subscribeCalls = (args.controllerMessenger.subscribe as jest.Mock)
      .mock.calls as SubscribeCall[];
    const willChangeCall = subscribeCalls.find(
      ([event]) => event === 'NetworkController:networkWillChange',
    );
    expect(willChangeCall).toBeDefined();

    willChangeCall![1]();
    expect(store.dispatch).toHaveBeenCalledWith(networkIdWillUpdate());
  });
});
