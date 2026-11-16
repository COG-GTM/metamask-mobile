import getDefaultBridgeParams from '../SDKConnect/AndroidSDK/getDefaultBridgeParams';
import BackgroundBridge from './BackgroundBridge';
import Engine from '../Engine';
import { createEip1193MethodMiddleware } from '../RPCMethods/createEip1193MethodMiddleware';
import createEthAccountsMethodMiddleware from '../RPCMethods/createEthAccountsMethodMiddleware';
import { getPermittedAccounts } from '../Permissions';
import { getCaip25PermissionFromLegacyPermissions } from '../../util/permissions';
import AppConstants from '../AppConstants';

jest.mock('../../util/permissions', () => ({
  getCaip25PermissionFromLegacyPermissions: jest.fn(),
}));

jest.mock('../Permissions', () => ({
  ...jest.requireActual('../Permissions'),
  getPermittedAccounts: jest.fn(),
}));

jest.mock('../RPCMethods/createEip1193MethodMiddleware', () => ({
  ...jest.requireActual('../RPCMethods/createEip1193MethodMiddleware'),
  createEip1193MethodMiddleware: jest.fn(),
}));

jest.mock('@metamask/eth-query', () => () => ({
  sendAsync: jest.fn().mockResolvedValue(1),
}));

jest.mock('../../store', () => ({
  ...jest.requireActual('../../store'),
  store: {
    getState: () => ({
      inpageProvider: {
        networkId: '',
      },
      engine: {
        backgroundState: {
          NetworkController: {
            networksMetadata: { 1: { status: false } },
            selectedNetworkClientId: '1',
          },
        },
      },
    }),
  },
}));

jest.mock('../RPCMethods/createEthAccountsMethodMiddleware');

createEthAccountsMethodMiddleware;

jest.mock('@metamask/eth-json-rpc-filters');
jest.mock('@metamask/eth-json-rpc-filters/subscriptionManager', () => () => ({
  events: {
    on: jest.fn(),
  },
}));

function setupBackgroundBridge(url, overrides = {}) {
  // Arrange
  const {
    AccountsController,
    PermissionController,
    SelectedNetworkController,
    NetworkController,
  } = Engine.context;

  AccountsController.getSelectedAccount.mockReturnValue({
    address: '0x0',
  });
  PermissionController.getPermissions.mockReturnValue({
    bind: jest.fn(),
  });
  PermissionController.getPermissions.mockReturnValue({
    bind: jest.fn(),
  });
  PermissionController.hasPermissions.mockReturnValue({
    bind: jest.fn(),
  });
  NetworkController.getNetworkConfigurationByChainId.mockReturnValue({
    bind: jest.fn(),
  });
  PermissionController.executeRestrictedMethod.mockReturnValue({
    bind: jest.fn(),
  });
  SelectedNetworkController.getProviderAndBlockTracker.mockReturnValue({
    provider: {},
  });
  PermissionController.updateCaveat.mockReturnValue(jest.fn());

  const defaultBridgeParams = getDefaultBridgeParams({
    originatorInfo: {
      url: 'string',
      title: 'title',
      platform: 'platform',
      dappId: '000',
    },
    clientId: 'clientId',
    connected: true,
  });

  // Act
  return new BackgroundBridge({
    webview: null,
    channelId: 'clientId',
    url,
    isRemoteConn: true,
    ...defaultBridgeParams,
    ...overrides,
  });
}

function getSubscription(eventName) {
  const call = Engine.controllerMessenger.subscribe.mock.calls.find(
    ([event]) => event === eventName,
  );
  if (!call) {
    throw new Error(`No subscription found for ${eventName}`);
  }
  const [, handler, selector] = call;
  return { handler, selector };
}

describe('BackgroundBridge', () => {
  beforeEach(() => jest.clearAllMocks());
  describe('constructor', () => {
    const { KeyringController, PermissionController } = Engine.context;

    it('creates Eip1193MethodMiddleware with expected hooks', async () => {
      const url = 'https:www.mock.io';
      const origin = new URL(url).hostname;
      const bridge = setupBackgroundBridge(url);
      const eip1193MethodMiddlewareHooks =
        createEip1193MethodMiddleware.mock.calls[0][0];

      // Assert getAccounts
      eip1193MethodMiddlewareHooks.getAccounts();
      expect(getPermittedAccounts).toHaveBeenCalledWith(bridge.channelId);

      // Assert getCaip25PermissionFromLegacyPermissionsForOrigin
      const requestedPermissions = { somePermission: true };
      eip1193MethodMiddlewareHooks.getCaip25PermissionFromLegacyPermissionsForOrigin(
        requestedPermissions,
      );
      expect(getCaip25PermissionFromLegacyPermissions).toHaveBeenCalledWith(
        origin,
        requestedPermissions,
      );

      // Assert getPermissionsForOrigin
      eip1193MethodMiddlewareHooks.getPermissionsForOrigin();
      expect(PermissionController.getPermissions).toHaveBeenCalledWith(origin);

      // Assert requestPermissionsForOrigin
      eip1193MethodMiddlewareHooks.requestPermissionsForOrigin(
        requestedPermissions,
      );
      expect(PermissionController.requestPermissions).toHaveBeenCalledWith(
        { origin },
        requestedPermissions,
      );

      // Assert revokePermissionsForOrigin
      const permissionKeys = ['a', 'b'];
      eip1193MethodMiddlewareHooks.revokePermissionsForOrigin(permissionKeys);
      expect(PermissionController.revokePermissions).toHaveBeenCalledWith({
        [origin]: permissionKeys,
      });

      // Assert updateCaveat
      const caveatType = 'testCaveat';
      const caveatValue = { someValue: true };
      eip1193MethodMiddlewareHooks.updateCaveat(caveatType, caveatValue);
      expect(PermissionController.updateCaveat).toHaveBeenCalledWith(
        origin,
        caveatType,
        caveatValue,
      );

      // Assert getUnlockPromise
      // when already unlocked
      KeyringController.isUnlocked.mockReturnValueOnce(true);
      const unlockPromise1 = eip1193MethodMiddlewareHooks.getUnlockPromise();
      await expect(unlockPromise1).resolves.toBeUndefined();
      expect(KeyringController.isUnlocked).toHaveBeenCalled();

      // when needs to be unlocked
      KeyringController.isUnlocked.mockReturnValueOnce(false);
      eip1193MethodMiddlewareHooks.getUnlockPromise();
      expect(Engine.controllerMessenger.subscribeOnceIf).toHaveBeenCalledWith(
        'KeyringController:unlock',
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('creates EthAccountsMethodMiddleware with expected hooks', async () => {
      const url = 'https:www.mock.io';
      const bridge = setupBackgroundBridge(url);
      const ethAccountsMethodMiddlewareHooks =
        createEthAccountsMethodMiddleware.mock.calls[0][0];

      // Assert getAccounts
      ethAccountsMethodMiddlewareHooks.getAccounts();
      expect(getPermittedAccounts).toHaveBeenCalledWith(bridge.channelId);
    });
  });

  describe('controller messenger subscriptions', () => {
    const url = 'https://www.mock.io';
    const { PermissionController } = Engine.context;
    const originalPermissionControllerName = PermissionController.name;
    const originalSelectedAddress =
      Engine.datamodel.state.PreferencesController.selectedAddress;
    const selectedAddress = '0x0000000000000000000000000000000000000abc';

    const originalUnsubscribe = Engine.controllerMessenger.unsubscribe;

    beforeEach(() => {
      Engine.controllerMessenger.unsubscribe = jest.fn();
      PermissionController.name = 'PermissionController';
      Engine.datamodel.state.PreferencesController.selectedAddress =
        selectedAddress;
    });

    afterEach(() => {
      Engine.controllerMessenger.unsubscribe = originalUnsubscribe;
      PermissionController.name = originalPermissionControllerName;
      Engine.datamodel.state.PreferencesController.selectedAddress =
        originalSelectedAddress;
    });

    it('subscribes to network, preferences, selected network, keyring and permission events', () => {
      setupBackgroundBridge(url);

      const subscribedEvents =
        Engine.controllerMessenger.subscribe.mock.calls.map(([event]) => event);
      expect(subscribedEvents).toEqual(
        expect.arrayContaining([
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
          'PreferencesController:stateChange',
          'SelectedNetworkController:stateChange',
          'KeyringController:lock',
          'KeyringController:unlock',
          'PermissionController:stateChange',
        ]),
      );
    });

    describe('KeyringController lock/unlock', () => {
      it.each([
        ['KeyringController:lock', false],
        ['KeyringController:unlock', true],
      ])(
        'sends unlockStateChanged on %s for a non-remote connection',
        (eventName, isUnlocked) => {
          const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
          const sendNotificationSpy = jest
            .spyOn(bridge, 'sendNotification')
            .mockImplementation(() => undefined);

          getSubscription(eventName).handler();

          expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
          expect(sendNotificationSpy).toHaveBeenCalledWith({
            method: AppConstants.NOTIFICATION_NAMES.unlockStateChanged,
            params: isUnlocked,
          });
        },
      );

      it.each(['KeyringController:lock', 'KeyringController:unlock'])(
        'does not notify on %s for a remote connection',
        (eventName) => {
          const bridge = setupBackgroundBridge(url, { isRemoteConn: true });
          const sendNotificationSpy = jest
            .spyOn(bridge, 'sendNotification')
            .mockImplementation(() => undefined);

          getSubscription(eventName).handler();

          expect(sendNotificationSpy).not.toHaveBeenCalled();
        },
      );

      it.each(['KeyringController:lock', 'KeyringController:unlock'])(
        'does not notify on %s once the bridge is disconnected',
        (eventName) => {
          const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
          const sendNotificationSpy = jest
            .spyOn(bridge, 'sendNotification')
            .mockImplementation(() => undefined);

          // Middleware is automocked, so the real engine teardown can't run here
          jest.spyOn(bridge.engine, 'destroy').mockImplementation(() => null);
          bridge.onDisconnect();
          getSubscription(eventName).handler();

          expect(bridge.disconnected).toBe(true);
          expect(sendNotificationSpy).not.toHaveBeenCalled();
        },
      );
    });

    describe('PermissionController stateChange', () => {
      it('scopes the subscription to the subject for the bridge channelId', () => {
        const bridge = setupBackgroundBridge(url);
        const { selector } = getSubscription(
          'PermissionController:stateChange',
        );

        const subject = { origin: bridge.channelId, permissions: {} };
        expect(
          selector({
            subjects: {
              [bridge.channelId]: subject,
              'other.io': { origin: 'other.io', permissions: {} },
            },
          }),
        ).toBe(subject);
        expect(selector({ subjects: { 'other.io': {} } })).toBeUndefined();
      });

      it('notifies the dapp of the selected address when its permissions change', () => {
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        const notifySelectedAddressChangedSpy = jest.spyOn(
          bridge,
          'notifySelectedAddressChanged',
        );
        const sendNotificationSpy = jest
          .spyOn(bridge, 'sendNotification')
          .mockImplementation(() => undefined);
        getPermittedAccounts.mockReturnValue(['0xdef', selectedAddress]);

        getSubscription('PermissionController:stateChange').handler({
          origin: bridge.channelId,
        });

        expect(notifySelectedAddressChangedSpy).toHaveBeenCalledWith(
          selectedAddress,
        );
        expect(getPermittedAccounts).toHaveBeenCalledWith(bridge.channelId);
        expect(sendNotificationSpy).toHaveBeenCalledWith({
          method: AppConstants.NOTIFICATION_NAMES.accountsChanged,
          params: [selectedAddress, '0xdef'],
        });
      });

      it('does not send accountsChanged when the selected address is no longer permitted', () => {
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        const sendNotificationSpy = jest
          .spyOn(bridge, 'sendNotification')
          .mockImplementation(() => undefined);
        getPermittedAccounts.mockReturnValue([]);

        getSubscription('PermissionController:stateChange').handler(undefined);

        expect(sendNotificationSpy).not.toHaveBeenCalled();
      });
    });

    describe('state change events', () => {
      it.each([
        AppConstants.NETWORK_STATE_CHANGE_EVENT,
        'PreferencesController:stateChange',
        'SelectedNetworkController:stateChange',
      ])('emits update and runs onStateUpdate on %s', (eventName) => {
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        const onStateUpdateSpy = jest
          .spyOn(bridge, 'onStateUpdate')
          .mockResolvedValue(undefined);
        const updateListener = jest.fn();
        bridge.on('update', updateListener);

        const { handler } = getSubscription(eventName);
        expect(handler).toBe(bridge.sendStateUpdate);
        handler();

        expect(updateListener).toHaveBeenCalledTimes(1);
        expect(onStateUpdateSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('state update notifications', () => {
      const prototypeSpies = [];
      const spyOnPrototype = (method) => {
        const spy = jest.spyOn(BackgroundBridge.prototype, method);
        prototypeSpies.push(spy);
        return spy;
      };

      afterEach(() => {
        prototypeSpies.splice(0).forEach((spy) => spy.mockRestore());
      });

      async function triggerStateUpdate(bridge, eventName) {
        const onStateUpdateSpy = jest.spyOn(bridge, 'onStateUpdate');
        getSubscription(eventName).handler();
        const { results } = onStateUpdateSpy.mock;
        await results[results.length - 1].value;
      }

      const callsWithMethod = (spy, method) =>
        spy.mock.calls.filter(([payload]) => payload.method === method);

      it('sends chainChanged when the network state changes to a new chain', async () => {
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        jest
          .spyOn(bridge, 'getProviderNetworkState')
          .mockResolvedValue({ chainId: '0x5', networkVersion: '5' });
        const sendNotificationSpy = jest
          .spyOn(bridge, 'sendNotification')
          .mockImplementation(() => undefined);

        await triggerStateUpdate(
          bridge,
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
        );

        expect(sendNotificationSpy).toHaveBeenCalledWith({
          method: AppConstants.NOTIFICATION_NAMES.chainChanged,
          params: { chainId: '0x5', networkVersion: '5' },
        });
        expect(bridge.lastChainIdSent).toBe('0x5');
      });

      it('does not send chainChanged when the chain is unchanged', async () => {
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        jest
          .spyOn(bridge, 'getProviderNetworkState')
          .mockResolvedValue({ chainId: '0x1', networkVersion: '1' });
        const sendNotificationSpy = jest
          .spyOn(bridge, 'sendNotification')
          .mockImplementation(() => undefined);

        await triggerStateUpdate(
          bridge,
          AppConstants.NETWORK_STATE_CHANGE_EVENT,
        );

        expect(sendNotificationSpy).not.toHaveBeenCalled();
      });

      it('sends accountsChanged once when the selected address changes for a remote connection', async () => {
        getPermittedAccounts.mockReturnValue([selectedAddress]);
        spyOnPrototype('notifyChainChanged').mockResolvedValue(undefined);
        const sendNotificationSpy = spyOnPrototype(
          'sendNotification',
        ).mockImplementation(() => undefined);
        const bridge = setupBackgroundBridge(url, { isRemoteConn: true });
        bridge.addressSent = '0x0';
        jest
          .spyOn(bridge, 'getProviderNetworkState')
          .mockResolvedValue({ chainId: '0x1', networkVersion: '1' });
        sendNotificationSpy.mockClear();

        await triggerStateUpdate(bridge, 'PreferencesController:stateChange');
        await triggerStateUpdate(bridge, 'PreferencesController:stateChange');

        const accountsChangedCalls = callsWithMethod(
          sendNotificationSpy,
          AppConstants.NOTIFICATION_NAMES.accountsChanged,
        );
        expect(accountsChangedCalls).toEqual([
          [
            {
              method: AppConstants.NOTIFICATION_NAMES.accountsChanged,
              params: [selectedAddress],
            },
          ],
        ]);
        expect(bridge.addressSent).toBe(selectedAddress);
      });

      it('does not send accountsChanged on selected address change for an in-app browser connection', async () => {
        getPermittedAccounts.mockReturnValue([selectedAddress]);
        const bridge = setupBackgroundBridge(url, { isRemoteConn: false });
        jest
          .spyOn(bridge, 'getProviderNetworkState')
          .mockResolvedValue({ chainId: '0x1', networkVersion: '1' });
        const sendNotificationSpy = jest
          .spyOn(bridge, 'sendNotification')
          .mockImplementation(() => undefined);

        await triggerStateUpdate(bridge, 'PreferencesController:stateChange');

        expect(sendNotificationSpy).not.toHaveBeenCalled();
      });
    });

    describe('initial notifications', () => {
      it('notifies chain and selected address on construction for a remote connection', () => {
        const notifyChainChangedSpy = jest
          .spyOn(BackgroundBridge.prototype, 'notifyChainChanged')
          .mockResolvedValue(undefined);
        const notifySelectedAddressChangedSpy = jest
          .spyOn(BackgroundBridge.prototype, 'notifySelectedAddressChanged')
          .mockResolvedValue(undefined);

        setupBackgroundBridge(url, { isRemoteConn: true });

        expect(notifyChainChangedSpy).toHaveBeenCalledTimes(1);
        expect(notifySelectedAddressChangedSpy).toHaveBeenCalledWith(
          selectedAddress,
        );
      });

      it('does not send initial notifications for a non-remote connection', () => {
        const notifyChainChangedSpy = jest
          .spyOn(BackgroundBridge.prototype, 'notifyChainChanged')
          .mockResolvedValue(undefined);
        const notifySelectedAddressChangedSpy = jest
          .spyOn(BackgroundBridge.prototype, 'notifySelectedAddressChanged')
          .mockResolvedValue(undefined);

        setupBackgroundBridge(url, { isRemoteConn: false });

        expect(notifyChainChangedSpy).not.toHaveBeenCalled();
        expect(notifySelectedAddressChangedSpy).not.toHaveBeenCalled();
      });
    });
  });
});
