import { merge } from 'lodash';
import { RootState } from '../reducers';
import initialRootState, {
  backgroundState,
} from '../util/test/initial-root-state';
import {
  selectIpfsGateway,
  selectUseNftDetection,
  selectShowMultiRpcModal,
  selectUseTokenDetection,
  selectDisplayNftMedia,
  selectUseSafeChainsListValidation,
  selectTokenSortConfig,
  selectTokenNetworkFilter,
  selectIsTokenNetworkFilterEqualCurrentNetwork,
  selectIsMultiAccountBalancesEnabled,
  selectShowTestNetworks,
  selectShowIncomingTransactionNetworks,
  selectIsIpfsGatewayEnabled,
  selectIsSecurityAlertsEnabled,
  selectSmartTransactionsOptInStatus,
  selectUseTransactionSimulations,
  selectPrivacyMode,
  selectSmartTransactionsMigrationApplied,
  selectSmartTransactionsBannerDismissed,
} from './preferencesController';

const buildState = (preferences: Record<string, unknown> = {}): RootState =>
  merge({}, initialRootState, {
    engine: {
      backgroundState: {
        PreferencesController: preferences,
      },
    },
  });

describe('preferencesController selectors', () => {
  const state = buildState();
  const preferences = backgroundState.PreferencesController;

  it('selects simple preference values', () => {
    expect(selectIpfsGateway(state)).toBe(preferences.ipfsGateway);
    expect(selectUseNftDetection(state)).toBe(preferences.useNftDetection);
    expect(selectShowMultiRpcModal(state)).toBe(preferences.showMultiRpcModal);
    expect(selectUseTokenDetection(state)).toBe(preferences.useTokenDetection);
    expect(selectDisplayNftMedia(state)).toBe(preferences.displayNftMedia);
    expect(selectUseSafeChainsListValidation(state)).toBe(
      preferences.useSafeChainsListValidation,
    );
    expect(selectTokenSortConfig(state)).toEqual(preferences.tokenSortConfig);
    expect(selectTokenNetworkFilter(state)).toEqual(
      preferences.tokenNetworkFilter,
    );
    expect(selectSmartTransactionsOptInStatus(state)).toBe(
      preferences.smartTransactionsOptInStatus,
    );
    expect(selectPrivacyMode(state)).toBe(preferences.privacyMode);
  });

  it('selects patched preference values', () => {
    expect(selectIsMultiAccountBalancesEnabled(state)).toBe(true);
    expect(selectShowTestNetworks(state)).toBe(false);
    expect(selectShowIncomingTransactionNetworks(state)).toEqual(
      expect.objectContaining({ '0x1': true }),
    );
    expect(selectIsIpfsGatewayEnabled(state)).toBe(true);
    expect(selectIsSecurityAlertsEnabled(state)).toBe(true);
    expect(selectUseTransactionSimulations(state)).toBe(true);
  });

  describe('selectIsTokenNetworkFilterEqualCurrentNetwork', () => {
    it('returns true when the filter only contains the current chain', () => {
      expect(
        selectIsTokenNetworkFilterEqualCurrentNetwork(
          buildState({ tokenNetworkFilter: { '0x1': true } }),
        ),
      ).toBe(true);
    });

    it('returns false when the filter contains multiple chains', () => {
      expect(
        selectIsTokenNetworkFilterEqualCurrentNetwork(
          buildState({ tokenNetworkFilter: { '0x1': true, '0x89': true } }),
        ),
      ).toBe(false);
    });

    it('returns false when the filter contains a different chain', () => {
      expect(
        selectIsTokenNetworkFilterEqualCurrentNetwork(
          buildState({ tokenNetworkFilter: { '0x89': true } }),
        ),
      ).toBe(false);
    });

    it('returns false when the filter is undefined', () => {
      const withoutFilter = buildState();
      // @ts-expect-error testing undefined filter
      withoutFilter.engine.backgroundState.PreferencesController.tokenNetworkFilter =
        undefined;
      expect(selectIsTokenNetworkFilterEqualCurrentNetwork(withoutFilter)).toBe(
        false,
      );
    });
  });

  describe('smart transactions feature flags', () => {
    it('default to false when the flags are missing', () => {
      expect(selectSmartTransactionsMigrationApplied(state)).toBe(false);
      expect(selectSmartTransactionsBannerDismissed(state)).toBe(false);
    });

    it('return the stored flag values', () => {
      const flagged = buildState({
        featureFlags: {
          smartTransactionsMigrationApplied: true,
          smartTransactionsBannerDismissed: true,
        },
      });
      expect(selectSmartTransactionsMigrationApplied(flagged)).toBe(true);
      expect(selectSmartTransactionsBannerDismissed(flagged)).toBe(true);
    });
  });
});
