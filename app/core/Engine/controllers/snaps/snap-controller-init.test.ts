import { SnapController } from '@metamask/snaps-controllers';
import { ControllerInitRequest } from '../../types';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  SnapControllerInitMessenger,
  SnapControllerMessenger,
} from '../../messengers/snaps';
import { snapControllerInit } from './snap-controller-init';
import { buildControllerInitRequestMock } from '../../utils/test-utils';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { KeyringControllerGetKeyringsByTypeAction } from '@metamask/keyring-controller';
import { store } from '../../../../store';

jest.mock('@metamask/snaps-controllers');

jest.mock('.../../../../store', () => ({
  store: {
    getState: jest.fn(),
  },
}));

function getInitRequestMock(
  baseMessenger = new ExtendedControllerMessenger<never, never>(),
): jest.Mocked<
  ControllerInitRequest<SnapControllerMessenger, SnapControllerInitMessenger>
> {
  const requestMock = {
    ...buildControllerInitRequestMock(baseMessenger),
    controllerMessenger: getSnapControllerMessenger(baseMessenger),
    initMessenger: getSnapControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SnapControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = snapControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SnapController);
  });

  it('passes the proper arguments to the controller', () => {
    snapControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapController);
    expect(controllerMock).toHaveBeenCalledWith({
      dynamicPermissions: expect.any(Array),
      messenger: expect.any(Object),
      state: undefined,
      clientCryptography: {
        pbkdf2Sha512: expect.any(Function),
      },
      detectSnapLocation: expect.any(Function),
      encryptor: expect.any(Object),
      environmentEndowmentPermissions: expect.any(Array),
      excludedPermissions: expect.any(Object),
      featureFlags: {
        allowLocalSnaps: false,
        disableSnapInstallation: true,
        requireAllowlist: true,
      },
      getFeatureFlags: expect.any(Function),
      getMnemonicSeed: expect.any(Function),
      maxIdleTime: expect.any(Number),
      preinstalledSnaps: expect.any(Array),
    });
  });

  describe('when METAMASK_BUILD_TYPE is flask', () => {
    const originalBuildType = process.env.METAMASK_BUILD_TYPE;

    beforeEach(() => {
      process.env.METAMASK_BUILD_TYPE = 'flask';
    });

    afterEach(() => {
      if (originalBuildType === undefined) {
        delete process.env.METAMASK_BUILD_TYPE;
      } else {
        process.env.METAMASK_BUILD_TYPE = originalBuildType;
      }
    });

    it('enables local snaps and installation without an allowlist', () => {
      snapControllerInit(getInitRequestMock());

      const controllerMock = jest.mocked(SnapController);
      expect(controllerMock.mock.calls[0][0].featureFlags).toEqual({
        allowLocalSnaps: true,
        disableSnapInstallation: false,
        requireAllowlist: false,
      });
    });
  });

  describe('getMnemonicSeed', () => {
    it('returns the mnemonic seed', async () => {
      const messenger = new ExtendedControllerMessenger<
        KeyringControllerGetKeyringsByTypeAction,
        never
      >();

      snapControllerInit(getInitRequestMock(messenger));

      const mock = jest.mocked(SnapController);
      const getMnemonicSeed = mock.mock.calls[0][0].getMnemonicSeed;

      const seed = new Uint8Array([1, 2, 3, 4]);
      messenger.registerActionHandler(
        'KeyringController:getKeyringsByType',
        () => [
          {
            type: 'HD Key Tree',
            seed,
          },
        ],
      );

      await expect(getMnemonicSeed()).resolves.toBe(seed);
    });

    it('throws an error if the keyring is not available', async () => {
      const messenger = new ExtendedControllerMessenger<
        KeyringControllerGetKeyringsByTypeAction,
        never
      >();

      snapControllerInit(getInitRequestMock(messenger));

      const controllerMock = jest.mocked(SnapController);
      const getMnemonicSeed = controllerMock.mock.calls[0][0].getMnemonicSeed;

      messenger.registerActionHandler(
        'KeyringController:getKeyringsByType',
        () => [],
      );

      await expect(getMnemonicSeed()).rejects.toThrow(
        'Primary keyring mnemonic unavailable.',
      );
    });
    it.each([
      ['has no seed', { type: 'HD Key Tree' }],
      ['has a string seed', { type: 'HD Key Tree', seed: '0x01020304' }],
      ['has an array seed', { type: 'HD Key Tree', seed: [1, 2, 3, 4] }],
    ])(
      'throws an error if the primary keyring %s',
      async (_description, keyring) => {
        const messenger = new ExtendedControllerMessenger<
          KeyringControllerGetKeyringsByTypeAction,
          never
        >();

        snapControllerInit(getInitRequestMock(messenger));

        const controllerMock = jest.mocked(SnapController);
        const getMnemonicSeed = controllerMock.mock.calls[0][0].getMnemonicSeed;

        messenger.registerActionHandler(
          'KeyringController:getKeyringsByType',
          () => [keyring],
        );

        await expect(getMnemonicSeed()).rejects.toThrow(
          'Primary keyring mnemonic unavailable.',
        );
      },
    );
  });

  describe('getFeatureFlags', () => {
    it('returns the dynamic feature flags', () => {
      snapControllerInit(getInitRequestMock());

      const controllerMock = jest.mocked(SnapController);
      const getFeatureFlags = controllerMock.mock.calls[0][0].getFeatureFlags;

      // @ts-expect-error: Partial mock.
      jest.mocked(store.getState).mockReturnValue({
        settings: {
          basicFunctionalityEnabled: true,
        },
      });

      expect(getFeatureFlags()).toEqual({
        disableSnaps: false,
      });
    });
  });
});
