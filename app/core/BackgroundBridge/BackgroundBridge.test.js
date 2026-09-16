import getDefaultBridgeParams from '../SDKConnect/AndroidSDK/getDefaultBridgeParams';
import BackgroundBridge from './BackgroundBridge';
import Engine from '../Engine';
import { createEip1193MethodMiddleware } from '../RPCMethods/createEip1193MethodMiddleware';
import createEthAccountsMethodMiddleware from '../RPCMethods/createEthAccountsMethodMiddleware';
import { getPermittedAccounts } from '../Permissions';
import { getCaip25PermissionFromLegacyPermissions } from '../../util/permissions';

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

function setupBackgroundBridge(url) {
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
  });
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

  describe('onDisconnect', () => {
    it('unsubscribes every controllerMessenger subscription made in the constructor', () => {
      const bridge = setupBackgroundBridge('https:www.mock.io');
      const { subscribe, unsubscribe } = Engine.controllerMessenger;
      const subscriptions = subscribe.mock.calls.map(([event, handler]) => [
        event,
        handler,
      ]);
      expect(subscriptions).toHaveLength(6);
      bridge.port.emit = jest.fn();

      bridge.onDisconnect();

      expect(bridge.disconnected).toBe(true);
      expect(bridge.port.emit).toHaveBeenCalledWith('disconnect', {
        name: bridge.port.name,
        data: null,
      });
      expect(unsubscribe).toHaveBeenCalledTimes(subscriptions.length);
      subscriptions.forEach(([event, handler]) => {
        expect(unsubscribe).toHaveBeenCalledWith(event, handler);
      });
    });

    it('uses stable handler references for lock, unlock and permission events', () => {
      const bridge = setupBackgroundBridge('https:www.mock.io');
      const { subscribe } = Engine.controllerMessenger;
      const handlerFor = (event) =>
        subscribe.mock.calls.find(([e]) => e === event)[1];

      expect(handlerFor('KeyringController:lock')).toBe(bridge.onLock);
      expect(handlerFor('KeyringController:unlock')).toBe(bridge.onUnlock);
      expect(handlerFor(bridge.permissionStateChangeEvent)).toBe(
        bridge.onPermissionStateChange,
      );
    });

    it('does not send unlock state notifications after disconnect', () => {
      const bridge = setupBackgroundBridge('https:www.mock.io');
      bridge.isRemoteConn = false;
      bridge.sendNotification = jest.fn();
      bridge.port.emit = jest.fn();

      bridge.onDisconnect();
      bridge.onLock();
      bridge.onUnlock();

      expect(bridge.sendNotification).not.toHaveBeenCalled();
    });
  });
});
