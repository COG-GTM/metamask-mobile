import {
  ConfirmationRedesignRemoteFlags,
  selectConfirmationRedesignFlags,
} from '.';
import { getFeatureFlagValue } from '../env';
import mockedEngine from '../../../core/__mocks__/MockedEngine';
import { mockedEmptyFlagsState, mockedUndefinedFlagsState } from '../mocks';

jest.mock('../../../core/Engine', () => ({
  init: () => mockedEngine.init(),
}));

jest.mock('../env', () => ({
  getFeatureFlagValue: jest.fn(
    jest.requireActual('../env').getFeatureFlagValue,
  ),
}));

const ENV_KEYS = [
  'FEATURE_FLAG_REDESIGNED_SIGNATURES',
  'FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS',
  'FEATURE_FLAG_REDESIGNED_CONTRACT_INTERACTION',
  'FEATURE_FLAG_REDESIGNED_TRANSFER',
] as const;

const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  ENV_KEYS.forEach((key) => delete process.env[key]);
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

const confirmationRedesignFlagsDefaultValues: ConfirmationRedesignRemoteFlags =
  {
    signatures: true,
    staking_confirmations: false,
    contract_interaction: false,
    transfer: false,
  };

// The selector is memoized on state identity, so each call gets a fresh state
// to make sure env changes between assertions are picked up.
const buildState = (confirmationRedesign?: unknown) => ({
  engine: {
    backgroundState: {
      RemoteFeatureFlagController: {
        remoteFeatureFlags:
          confirmationRedesign === undefined
            ? {}
            : { confirmation_redesign: confirmationRedesign },
        cacheTimestamp: 0,
      },
    },
  },
});

const selectFlags = (confirmationRedesign?: unknown) =>
  selectConfirmationRedesignFlags(
    buildState(confirmationRedesign) as unknown as Parameters<
      typeof selectConfirmationRedesignFlags
    >[0],
  );

describe('confirmationRedesign Feature flag: selectConfirmationRedesignFlags selector', () => {
  describe('defaults', () => {
    it('returns default values when empty feature flag state', () => {
      expect(selectConfirmationRedesignFlags(mockedEmptyFlagsState)).toEqual(
        confirmationRedesignFlagsDefaultValues,
      );
    });

    it('returns default values when undefined RemoteFeatureFlagController state', () => {
      expect(
        selectConfirmationRedesignFlags(mockedUndefinedFlagsState),
      ).toEqual(confirmationRedesignFlagsDefaultValues);
    });
  });

  describe('remote payload validation', () => {
    it('uses remote values for signatures and staking when the payload is valid', () => {
      expect(
        selectFlags({
          signatures: false,
          staking_confirmations: true,
          contract_interaction: true,
          transfer: true,
        }),
      ).toEqual({
        signatures: false,
        staking_confirmations: true,
        // contract_interaction and transfer are not yet driven by remote values
        contract_interaction: false,
        transfer: false,
      });
    });

    it.each([
      [
        'missing contract_interaction',
        { signatures: false, staking_confirmations: true },
      ],
      [
        'missing staking_confirmations',
        { signatures: false, contract_interaction: true },
      ],
      [
        'missing signatures',
        { staking_confirmations: true, contract_interaction: true },
      ],
      ['not an object', true],
      ['null', null],
      ['an array', [false, true, true]],
    ])('falls back to defaults when the remote payload is %s', (_, payload) => {
      expect(selectFlags(payload)).toEqual(
        confirmationRedesignFlagsDefaultValues,
      );
      expect(getFeatureFlagValue).toHaveBeenCalledWith(
        undefined,
        confirmationRedesignFlagsDefaultValues.signatures,
      );
      expect(getFeatureFlagValue).toHaveBeenCalledWith(
        undefined,
        confirmationRedesignFlagsDefaultValues.staking_confirmations,
      );
    });
  });

  describe('transfer flag', () => {
    it('is false when FEATURE_FLAG_REDESIGNED_TRANSFER is unset', () => {
      expect(selectFlags().transfer).toBe(false);
    });

    it('is true when FEATURE_FLAG_REDESIGNED_TRANSFER is "true"', () => {
      process.env.FEATURE_FLAG_REDESIGNED_TRANSFER = 'true';
      expect(selectFlags().transfer).toBe(true);
    });

    it.each(['false', '', 'TRUE', '1'])(
      'is false when FEATURE_FLAG_REDESIGNED_TRANSFER is %p',
      (value) => {
        process.env.FEATURE_FLAG_REDESIGNED_TRANSFER = value;
        expect(selectFlags().transfer).toBe(false);
      },
    );

    it('ignores the remote transfer value', () => {
      expect(
        selectFlags({
          signatures: true,
          staking_confirmations: false,
          contract_interaction: false,
          transfer: true,
        }).transfer,
      ).toBe(false);
    });

    it('does not change the other flags when enabled', () => {
      process.env.FEATURE_FLAG_REDESIGNED_TRANSFER = 'true';
      expect(selectFlags()).toEqual({
        ...confirmationRedesignFlagsDefaultValues,
        transfer: true,
      });
    });
  });

  describe('env overrides', () => {
    const validRemote = {
      signatures: true,
      staking_confirmations: false,
      contract_interaction: false,
      transfer: false,
    };

    it('FEATURE_FLAG_REDESIGNED_SIGNATURES="false" overrides a remote true', () => {
      process.env.FEATURE_FLAG_REDESIGNED_SIGNATURES = 'false';
      expect(selectFlags(validRemote).signatures).toBe(false);
    });

    it('FEATURE_FLAG_REDESIGNED_SIGNATURES="true" overrides a remote false', () => {
      process.env.FEATURE_FLAG_REDESIGNED_SIGNATURES = 'true';
      expect(
        selectFlags({ ...validRemote, signatures: false }).signatures,
      ).toBe(true);
    });

    it('FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS="true" overrides a remote false', () => {
      process.env.FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS = 'true';
      expect(selectFlags(validRemote).staking_confirmations).toBe(true);
    });

    it('FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS="false" overrides a remote true', () => {
      process.env.FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS = 'false';
      expect(
        selectFlags({ ...validRemote, staking_confirmations: true })
          .staking_confirmations,
      ).toBe(false);
    });

    it('FEATURE_FLAG_REDESIGNED_CONTRACT_INTERACTION="true" enables contract interaction', () => {
      process.env.FEATURE_FLAG_REDESIGNED_CONTRACT_INTERACTION = 'true';
      expect(selectFlags(validRemote).contract_interaction).toBe(true);
    });

    it('env overrides also apply on top of the default fallback', () => {
      process.env.FEATURE_FLAG_REDESIGNED_SIGNATURES = 'false';
      process.env.FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS = 'true';
      expect(selectFlags({ signatures: true })).toEqual({
        signatures: false,
        staking_confirmations: true,
        contract_interaction: false,
        transfer: false,
      });
    });

    it('falls back to the remote value for unrecognised env values', () => {
      process.env.FEATURE_FLAG_REDESIGNED_SIGNATURES = 'yes';
      process.env.FEATURE_FLAG_REDESIGNED_STAKING_TRANSACTIONS = '0';
      expect(
        selectFlags({
          ...validRemote,
          signatures: false,
          staking_confirmations: true,
        }),
      ).toMatchObject({ signatures: false, staking_confirmations: true });
    });
  });
});
