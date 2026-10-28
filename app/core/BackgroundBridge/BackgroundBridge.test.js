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

const SelectedNetworkControllerProviderOrigin = () =>
  Engine.context.SelectedNetworkController.getProviderAndBlockTracker.mock
    .calls[0][0];

function setupInAppBrowserBridge(url) {
  setupBackgroundBridge('https://unused.example');
  jest.clearAllMocks();
  const { AccountsController, SelectedNetworkController } = Engine.context;
  AccountsController.getSelectedAccount.mockReturnValue({ address: '0x0' });
  SelectedNetworkController.getProviderAndBlockTracker.mockReturnValue({
    provider: {},
  });
  const getRpcMethodMiddleware = jest.fn(() => (_req, _res, next) => next());
  const bridge = new BackgroundBridge({
    webview: null,
    url,
    getRpcMethodMiddleware,
    isMainFrame: true,
  });
  return { bridge, getRpcMethodMiddleware };
}

describe('BackgroundBridge', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('in-app browser permission subject', () => {
    const { PermissionController } = Engine.context;
    const grantedAccounts = { 'dapp.example': ['0xabc'] };

    beforeEach(() => {
      getPermittedAccounts.mockImplementation(
        (subject) => grantedAccounts[subject] ?? [],
      );
    });

    it('keeps the bare hostname as the subject for default-port https pages', () => {
      const { bridge, getRpcMethodMiddleware } = setupInAppBrowserBridge(
        'https://dapp.example',
      );
      const hooks = createEip1193MethodMiddleware.mock.calls[0][0];
      const ethAccountsHooks =
        createEthAccountsMethodMiddleware.mock.calls[0][0];

      expect(bridge.hostname).toBe('dapp.example');
      expect(hooks.getAccounts()).toStrictEqual(['0xabc']);
      expect(ethAccountsHooks.getAccounts()).toStrictEqual(['0xabc']);
      expect(
        PermissionController.createPermissionMiddleware,
      ).toHaveBeenCalledWith({ origin: 'dapp.example' });
      expect(getRpcMethodMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({ hostname: 'dapp.example' }),
      );
    });

    it.each([
      ['http://dapp.example', 'http://dapp.example'],
      ['https://dapp.example:8443', 'https://dapp.example:8443'],
    ])('does not expose https grants to %s', (url, expectedSubject) => {
      const { bridge, getRpcMethodMiddleware } = setupInAppBrowserBridge(url);
      const hooks = createEip1193MethodMiddleware.mock.calls[0][0];
      const ethAccountsHooks =
        createEthAccountsMethodMiddleware.mock.calls[0][0];

      expect(bridge.hostname).toBe(expectedSubject);

      // eth_accounts returns nothing for the http / other-port page
      expect(hooks.getAccounts()).toStrictEqual([]);
      expect(ethAccountsHooks.getAccounts()).toStrictEqual([]);
      expect(getPermittedAccounts).toHaveBeenCalledWith(expectedSubject);
      expect(getPermittedAccounts).not.toHaveBeenCalledWith('dapp.example');

      // eth_requestAccounts asks for a fresh grant for the distinct subject
      const requested = { eth_accounts: {} };
      hooks.requestPermissionsForOrigin(requested);
      expect(PermissionController.requestPermissions).toHaveBeenCalledWith(
        { origin: expectedSubject },
        requested,
      );

      // Restricted methods and approval requests are keyed by the same subject
      expect(
        PermissionController.createPermissionMiddleware,
      ).toHaveBeenCalledWith({ origin: expectedSubject });
      expect(SelectedNetworkControllerProviderOrigin()).toBe(expectedSubject);
      expect(getRpcMethodMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({ hostname: expectedSubject }),
      );
    });

    it('keeps hostname keying for remote (SDK) connections', () => {
      const bridge = setupBackgroundBridge('http://dapp.example');
      expect(bridge.hostname).toBe('dapp.example');
    });
  });

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
});
