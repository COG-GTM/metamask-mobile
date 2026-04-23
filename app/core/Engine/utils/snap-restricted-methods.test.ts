///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import { KeyringTypes } from '@metamask/keyring-controller';
import { createSnapRestrictedMethods } from './snap-restricted-methods';
import type { SnapRestrictedMethodsDeps } from './snap-restricted-methods';
import { handleSnapRequest } from '../../Snaps/utils';
import { pbkdf2 } from '../../Encryptor';
import I18n from '../../../../locales/i18n';

jest.mock('../../Snaps/utils', () => ({
  handleSnapRequest: jest.fn(),
}));

jest.mock('../../Encryptor', () => ({
  pbkdf2: jest.fn(),
}));

jest.mock('../../../../locales/i18n', () => ({
  __esModule: true,
  default: { locale: 'en' },
}));

function buildMockDeps(
  overrides?: Partial<SnapRestrictedMethodsDeps>,
): SnapRestrictedMethodsDeps {
  return {
    controllerMessenger: {
      call: jest.fn(),
    } as unknown as SnapRestrictedMethodsDeps['controllerMessenger'],
    approvalController: {
      addAndShowApprovalRequest: jest.fn(),
    } as unknown as SnapRestrictedMethodsDeps['approvalController'],
    getPrimaryKeyringMnemonic: jest.fn(() => new Uint8Array([1, 2, 3])),
    getPrimaryKeyringMnemonicSeed: jest.fn(() => new Uint8Array([4, 5, 6])),
    getUnlockPromise: jest.fn(() => Promise.resolve()),
    getPreferences: jest.fn(() => ({
      securityAlertsEnabled: true,
      useTransactionSimulations: true,
      useTokenDetection: true,
      privacyMode: false,
      useNftDetection: true,
      displayNftMedia: true,
      isMultiAccountBalancesEnabled: true,
    })),
    getContext: jest.fn(() => ({
      CurrencyRateController: {
        state: { currentCurrency: 'usd' },
      },
    })),
    ...overrides,
  } as unknown as SnapRestrictedMethodsDeps;
}

describe('createSnapRestrictedMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an object with all expected methods', () => {
    const deps = buildMockDeps();
    const methods = createSnapRestrictedMethods(deps);

    expect(methods).toHaveProperty('clearSnapState');
    expect(methods).toHaveProperty('getMnemonic');
    expect(methods).toHaveProperty('getMnemonicSeed');
    expect(methods).toHaveProperty('getUnlockPromise');
    expect(methods).toHaveProperty('getSnap');
    expect(methods).toHaveProperty('handleSnapRpcRequest');
    expect(methods).toHaveProperty('getSnapState');
    expect(methods).toHaveProperty('updateSnapState');
    expect(methods).toHaveProperty('maybeUpdatePhishingList');
    expect(methods).toHaveProperty('isOnPhishingList');
    expect(methods).toHaveProperty('showDialog');
    expect(methods).toHaveProperty('showInAppNotification');
    expect(methods).toHaveProperty('createInterface');
    expect(methods).toHaveProperty('getInterface');
    expect(methods).toHaveProperty('updateInterface');
    expect(methods).toHaveProperty('requestUserApproval');
    expect(methods).toHaveProperty('hasPermission');
    expect(methods).toHaveProperty('getClientCryptography');
    expect(methods).toHaveProperty('getPreferences');
  });

  describe('getMnemonic', () => {
    it('returns primary keyring mnemonic when no source is provided', async () => {
      const deps = buildMockDeps();
      const methods = createSnapRestrictedMethods(deps);

      const result = await methods.getMnemonic();
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
      expect(deps.getPrimaryKeyringMnemonic).toHaveBeenCalled();
    });

    it('fetches mnemonic from keyring by source ID', async () => {
      const mockMnemonic = new Uint8Array([7, 8, 9]);
      const deps = buildMockDeps({
        controllerMessenger: {
          call: jest.fn().mockResolvedValue({
            type: KeyringTypes.hd,
            mnemonic: mockMnemonic,
          }),
        } as unknown as SnapRestrictedMethodsDeps['controllerMessenger'],
      });
      const methods = createSnapRestrictedMethods(deps);

      const result = await methods.getMnemonic('source-1');
      expect(result).toEqual(mockMnemonic);
    });

    it('throws when source keyring is not HD type', async () => {
      const deps = buildMockDeps({
        controllerMessenger: {
          call: jest.fn().mockResolvedValue({
            type: 'Simple Key Pair',
            mnemonic: new Uint8Array([1]),
          }),
        } as unknown as SnapRestrictedMethodsDeps['controllerMessenger'],
      });
      const methods = createSnapRestrictedMethods(deps);

      await expect(methods.getMnemonic('source-1')).rejects.toThrow(
        'Entropy source with ID "source-1" not found.',
      );
    });
  });

  describe('getMnemonicSeed', () => {
    it('returns primary keyring seed when no source is provided', async () => {
      const deps = buildMockDeps();
      const methods = createSnapRestrictedMethods(deps);

      const result = await methods.getMnemonicSeed();
      expect(result).toEqual(new Uint8Array([4, 5, 6]));
      expect(deps.getPrimaryKeyringMnemonicSeed).toHaveBeenCalled();
    });

    it('throws when source keyring has no seed', async () => {
      const deps = buildMockDeps({
        controllerMessenger: {
          call: jest.fn().mockResolvedValue({
            type: KeyringTypes.hd,
            seed: undefined,
          }),
        } as unknown as SnapRestrictedMethodsDeps['controllerMessenger'],
      });
      const methods = createSnapRestrictedMethods(deps);

      await expect(methods.getMnemonicSeed('source-1')).rejects.toThrow(
        'Entropy source with ID "source-1" not found.',
      );
    });
  });

  it('handleSnapRpcRequest delegates to handleSnapRequest', async () => {
    const deps = buildMockDeps();
    const methods = createSnapRestrictedMethods(deps);
    const mockArgs = { snapId: 'snap-1', handler: 'onRpcRequest' };

    await methods.handleSnapRpcRequest(mockArgs as never);
    expect(handleSnapRequest).toHaveBeenCalledWith(
      deps.controllerMessenger,
      mockArgs,
    );
  });

  it('showDialog calls approvalController.addAndShowApprovalRequest', () => {
    const deps = buildMockDeps();
    const methods = createSnapRestrictedMethods(deps);

    methods.showDialog('snap-origin', 'alert' as never, { type: 'text' }, undefined);
    expect(
      deps.approvalController.addAndShowApprovalRequest,
    ).toHaveBeenCalledWith({
      origin: 'snap-origin',
      type: 'alert',
      requestData: { content: { type: 'text' }, placeholder: undefined },
    });
  });

  it('isOnPhishingList calls PhishingController:testOrigin', () => {
    const deps = buildMockDeps({
      controllerMessenger: {
        call: jest.fn().mockReturnValue({ result: true }),
      } as unknown as SnapRestrictedMethodsDeps['controllerMessenger'],
    });
    const methods = createSnapRestrictedMethods(deps);

    const result = methods.isOnPhishingList('evil.com');
    expect(result).toBe(true);
    expect(deps.controllerMessenger.call).toHaveBeenCalledWith(
      'PhishingController:testOrigin',
      'evil.com',
    );
  });

  it('getClientCryptography returns pbkdf2', () => {
    const deps = buildMockDeps();
    const methods = createSnapRestrictedMethods(deps);

    const crypto = methods.getClientCryptography();
    expect(crypto).toEqual({ pbkdf2Sha512: pbkdf2 });
  });

  it('getPreferences reads from deps and I18n', () => {
    const deps = buildMockDeps();
    const methods = createSnapRestrictedMethods(deps);

    const prefs = methods.getPreferences();
    expect(prefs.locale).toBe('en');
    expect(prefs.currency).toBe('usd');
    expect(prefs.hideBalances).toBe(false);
    expect(prefs.useSecurityAlerts).toBe(true);
    expect(prefs.simulateOnChainActions).toBe(true);
    expect(prefs.useTokenDetection).toBe(true);
    expect(prefs.batchCheckBalances).toBe(true);
    expect(prefs.displayNftMedia).toBe(true);
    expect(prefs.useNftDetection).toBe(true);
    expect(prefs.useExternalPricingData).toBe(true);
  });
});
///: END:ONLY_INCLUDE_IF
