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
  middleware: (_req, _res, next) => next(),
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

function setupWalletConnectBackgroundBridge(url, origin) {
  setupBackgroundBridge(url);
  jest.clearAllMocks();
  return new BackgroundBridge({
    webview: null,
    url,
    origin,
    isWalletConnect: true,
    isMainFrame: true,
    wcRequestActions: {
      approveRequest: jest.fn(),
      rejectRequest: jest.fn(),
      updateSession: jest.fn(),
    },
    getRpcMethodMiddleware: () => (_req, _res, next) => next(),
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

  describe('WalletConnect origin isolation', () => {
    const browserSiteAccounts = ['0x1111', '0x2222'];
    const { PermissionController } = Engine.context;

    beforeEach(() => {
      getPermittedAccounts.mockImplementation((subject) =>
        subject === 'example.com' ? browserSiteAccounts : [],
      );
    });

    afterEach(() => {
      getPermittedAccounts.mockReset();
      createEip1193MethodMiddleware.mockReset();
      createEthAccountsMethodMiddleware.mockReset();
    });

    it('uses the provided origin instead of the bare hostname for the whole pipeline', () => {
      const bridge = setupWalletConnectBackgroundBridge(
        'https://example.com',
        'wc::example.com',
      );
      expect(bridge.hostname).toBe('example.com');
      expect(bridge.origin).toBe('wc::example.com');

      const eip1193Hooks = createEip1193MethodMiddleware.mock.calls[0][0];
      expect(eip1193Hooks.getAccounts()).toStrictEqual([]);
      expect(getPermittedAccounts).toHaveBeenLastCalledWith('wc::example.com');

      eip1193Hooks.getPermissionsForOrigin();
      expect(PermissionController.getPermissions).toHaveBeenCalledWith(
        'wc::example.com',
      );
      eip1193Hooks.requestPermissionsForOrigin({ eth_accounts: {} });
      expect(PermissionController.requestPermissions).toHaveBeenCalledWith(
        { origin: 'wc::example.com' },
        { eth_accounts: {} },
      );
      eip1193Hooks.revokePermissionsForOrigin(['endowment:caip25']);
      expect(PermissionController.revokePermissions).toHaveBeenCalledWith({
        'wc::example.com': ['endowment:caip25'],
      });
      expect(PermissionController.revokePermissions).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'example.com': expect.anything() }),
      );

      const ethAccountsHooks =
        createEthAccountsMethodMiddleware.mock.calls[0][0];
      expect(ethAccountsHooks.getAccounts()).toStrictEqual([]);

      expect(
        PermissionController.createPermissionMiddleware,
      ).toHaveBeenCalledWith({ origin: 'wc::example.com' });
      expect(
        Engine.context.SelectedNetworkController.getProviderAndBlockTracker,
      ).toHaveBeenCalledWith('wc::example.com');
    });

    it('does not return the in-app browser site accounts for eth_accounts', async () => {
      createEip1193MethodMiddleware.mockImplementation(
        jest.requireActual('../RPCMethods/createEip1193MethodMiddleware')
          .createEip1193MethodMiddleware,
      );
      createEthAccountsMethodMiddleware.mockImplementation(
        jest.requireActual('../RPCMethods/createEthAccountsMethodMiddleware')
          .default,
      );
      require('@metamask/eth-json-rpc-filters').mockImplementation(
        () => (_req, _res, next) => next(),
      );
      const bridge = setupWalletConnectBackgroundBridge(
        'https://example.com',
        'wc::example.com',
      );

      const response = await bridge.engine.handle({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_accounts',
        params: [],
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toStrictEqual([]);
      expect(getPermittedAccounts).not.toHaveBeenCalledWith('example.com');
    });

    it('keeps the bare hostname as origin when none is provided', () => {
      const bridge = setupWalletConnectBackgroundBridge('https://example.com');
      expect(bridge.origin).toBe('example.com');
      const eip1193Hooks = createEip1193MethodMiddleware.mock.calls[0][0];
      expect(eip1193Hooks.getAccounts()).toStrictEqual(browserSiteAccounts);
    });
  });
});
