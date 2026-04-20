import { SubjectType } from '@metamask/permission-controller';
import { KeyringTypes } from '@metamask/keyring-controller';

const mockCreateSnapsMethodMiddleware = jest.fn();
jest.mock('@metamask/snaps-rpc-methods', () => ({
  createSnapsMethodMiddleware: (...args: unknown[]) =>
    mockCreateSnapsMethodMiddleware(...args),
}));

const mockHandleSnapRequest = jest.fn();
jest.mock('./utils', () => ({
  handleSnapRequest: (...args: unknown[]) => mockHandleSnapRequest(...args),
}));

jest.mock('../Engine/controllers/snaps', () => ({
  CronjobControllerCancelBackgroundEventAction:
    'CronjobController:cancelBackgroundEvent',
  CronjobControllerGetBackgroundEventsAction:
    'CronjobController:getBackgroundEvents',
  SnapControllerClearSnapStateAction: 'SnapController:clearSnapState',
  SnapControllerGetPermittedSnapsAction: 'SnapController:getPermittedSnaps',
  SnapControllerGetSnapAction: 'SnapController:get',
  SnapControllerGetSnapFileAction: 'SnapController:getSnapFile',
  SnapControllerGetSnapStateAction: 'SnapController:getSnapState',
  SnapControllerInstallSnapsAction: 'SnapController:install',
  SnapControllerUpdateSnapStateAction: 'SnapController:updateSnapState',
  SnapInterfaceControllerCreateInterfaceAction:
    'SnapInterfaceController:createInterface',
  SnapInterfaceControllerResolveInterfaceAction:
    'SnapInterfaceController:resolveInterface',
  SnapInterfaceControllerUpdateInterfaceAction:
    'SnapInterfaceController:updateInterface',
  SnapInterfaceControllerUpdateInterfaceStateAction:
    'SnapInterfaceController:updateInterfaceState',
}));

import snapMethodMiddlewareBuilder, {
  getSnapIdFromRequest,
} from './SnapsMethodMiddleware';

describe('getSnapIdFromRequest', () => {
  it('returns the snapId when present as a string', () => {
    expect(getSnapIdFromRequest({ snapId: 'npm:@metamask/example-snap' })).toBe(
      'npm:@metamask/example-snap',
    );
  });

  it('returns null when snapId is missing', () => {
    expect(getSnapIdFromRequest({})).toBeNull();
  });

  it('returns null when snapId is not a string', () => {
    expect(getSnapIdFromRequest({ snapId: 1234 })).toBeNull();
  });
});

describe('snapMethodMiddlewareBuilder', () => {
  const origin = 'npm:@metamask/example-snap';

  type Hooks = Parameters<typeof mockCreateSnapsMethodMiddleware>[1];

  function capture(subjectType: SubjectType = SubjectType.Snap) {
    const subscribeOnceIf = jest.fn();
    const controllerMessenger = {
      call: jest.fn(),
      subscribeOnceIf,
    };

    const engineContext = {
      KeyringController: { isUnlocked: jest.fn().mockReturnValue(true) },
      PermissionController: {
        requestPermissions: jest.fn(),
        getPermissions: jest.fn(),
        hasPermission: jest.fn(),
        executeRestrictedMethod: jest.fn(),
      },
      ApprovalController: { addAndShowApprovalRequest: jest.fn() },
    };

    mockCreateSnapsMethodMiddleware.mockClear();

    snapMethodMiddlewareBuilder(
      engineContext as unknown as Parameters<typeof snapMethodMiddlewareBuilder>[0],
      controllerMessenger as unknown as Parameters<typeof snapMethodMiddlewareBuilder>[1],
      origin,
      subjectType,
    );

    const [isSnap, hooks] = mockCreateSnapsMethodMiddleware.mock.calls[0] as [
      boolean,
      Hooks,
    ];
    return { isSnap, hooks, engineContext, controllerMessenger };
  }

  it('passes the correct isSnap flag to createSnapsMethodMiddleware', () => {
    const { isSnap } = capture(SubjectType.Snap);
    expect(isSnap).toBe(true);

    const other = capture(SubjectType.Website);
    expect(other.isSnap).toBe(false);
  });

  it('getUnlockPromise resolves immediately when the keyring is unlocked', async () => {
    const { hooks } = capture();
    await expect(hooks.getUnlockPromise()).resolves.toBeUndefined();
  });

  it('getUnlockPromise waits for KeyringController:unlock when locked', async () => {
    const { hooks, engineContext, controllerMessenger } = capture();
    (engineContext.KeyringController.isUnlocked as jest.Mock).mockReturnValue(
      false,
    );
    const promise = hooks.getUnlockPromise();
    const [, resolveFn] = (
      controllerMessenger.subscribeOnceIf as jest.Mock
    ).mock.calls[0];
    resolveFn();
    await expect(promise).resolves.toBeUndefined();
  });

  it('requestPermissions delegates to the PermissionController', async () => {
    const { hooks, engineContext } = capture();
    await hooks.requestPermissions({ foo: {} });
    expect(engineContext.PermissionController.requestPermissions).toHaveBeenCalledWith(
      { origin },
      { foo: {} },
    );
  });

  it('handleSnapRpcRequest errors if snapId is missing from the request', async () => {
    const { hooks } = capture();
    await expect(
      hooks.handleSnapRpcRequest({
        handler: 'onRpcRequest',
        request: { method: 'foo' },
      }),
    ).rejects.toThrow(/snapId not found/);
  });

  it('handleSnapRpcRequest routes valid requests through handleSnapRequest', async () => {
    const { hooks, controllerMessenger } = capture();
    mockHandleSnapRequest.mockResolvedValue({ ok: true });

    const out = await hooks.handleSnapRpcRequest({
      snapId: 'npm:@metamask/another-snap',
      handler: 'onRpcRequest',
      request: { method: 'foo' },
    });

    expect(out).toEqual({ ok: true });
    expect(mockHandleSnapRequest).toHaveBeenCalledWith(controllerMessenger, {
      snapId: 'npm:@metamask/another-snap',
      origin,
      handler: 'onRpcRequest',
      request: { method: 'foo' },
    });
  });

  it('getEntropySources maps HD keyrings and filters others', () => {
    const { hooks, controllerMessenger } = capture();
    (controllerMessenger.call as jest.Mock).mockReturnValue({
      keyrings: [
        { type: KeyringTypes.hd },
        { type: KeyringTypes.simple },
        { type: KeyringTypes.hd },
      ],
      keyringsMetadata: [
        { id: 'id-1', name: 'hd-1' },
        { id: 'id-2', name: 'simple-1' },
        { id: 'id-3', name: 'hd-2' },
      ],
    });

    expect(hooks.getEntropySources()).toEqual([
      { id: 'id-1', name: 'hd-1', type: 'mnemonic', primary: true },
      { id: 'id-3', name: 'hd-2', type: 'mnemonic', primary: false },
    ]);
  });

  it('getIsLocked is the inverse of KeyringController.isUnlocked', () => {
    const { hooks, engineContext } = capture();
    (engineContext.KeyringController.isUnlocked as jest.Mock).mockReturnValue(
      true,
    );
    expect(hooks.getIsLocked()).toBe(false);
    (engineContext.KeyringController.isUnlocked as jest.Mock).mockReturnValue(
      false,
    );
    expect(hooks.getIsLocked()).toBe(true);
  });

  it('scheduleBackgroundEvent adds the snapId to the payload', () => {
    const { hooks, controllerMessenger } = capture();
    const event = { date: '2025-01-01', request: { method: 'x' } } as unknown as Parameters<typeof hooks.scheduleBackgroundEvent>[0];
    hooks.scheduleBackgroundEvent(event);
    expect(controllerMessenger.call).toHaveBeenCalledWith(
      'CronjobController:scheduleBackgroundEvent',
      {
        ...event,
        snapId: origin,
      },
    );
  });

  it('getInterfaceContext and getInterfaceState read from SnapInterfaceController:getInterface', () => {
    const { hooks, controllerMessenger } = capture();
    (controllerMessenger.call as jest.Mock).mockReturnValue({
      context: { foo: 'c' },
      state: { bar: 'd' },
    });

    expect(hooks.getInterfaceContext('iid')).toEqual({ foo: 'c' });
    expect(hooks.getInterfaceState('iid')).toEqual({ bar: 'd' });
  });
});
