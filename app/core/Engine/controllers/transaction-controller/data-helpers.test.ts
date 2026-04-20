import {
  disabledSmartTransactionsState,
  enabledSmartTransactionsState,
} from './data-helpers';

describe('transaction-controller data-helpers', () => {
  describe('enabledSmartTransactionsState', () => {
    it('enables smart transactions at the controller and preference level', () => {
      const background =
        enabledSmartTransactionsState.engine.backgroundState;
      expect(background.SmartTransactionsController.enabled).toBe(true);
      expect(background.SmartTransactionsController.smartTransactionsState.liveness).toBe(
        true,
      );
      expect(background.PreferencesController.smartTransactionsOptInStatus).toBe(
        true,
      );
    });

    it('enables the mobile smart-transactions swaps feature flags', () => {
      expect(
        enabledSmartTransactionsState.swaps.featureFlags.smart_transactions
          .mobile_active,
      ).toBe(true);
      expect(
        enabledSmartTransactionsState.swaps.featureFlags.smartTransactions
          .mobileActive,
      ).toBe(true);
    });

    it('exposes a selected EVM mainnet network configuration', () => {
      const network =
        enabledSmartTransactionsState.engine.backgroundState.NetworkController;
      expect(network.selectedNetworkClientId).toBe('mainnet');
      expect(network.networkConfigurationsByChainId['0x1'].chainId).toBe('0x1');
    });
  });

  describe('disabledSmartTransactionsState', () => {
    it('overrides the opt-in preference to false', () => {
      expect(
        disabledSmartTransactionsState.engine.backgroundState
          .PreferencesController.smartTransactionsOptInStatus,
      ).toBe(false);
    });

    it('preserves the remaining state from enabledSmartTransactionsState', () => {
      expect(
        disabledSmartTransactionsState.engine.backgroundState
          .SmartTransactionsController.enabled,
      ).toBe(true);
      expect(
        disabledSmartTransactionsState.swaps.featureFlags.smart_transactions
          .mobile_active,
      ).toBe(true);
    });

    it('does not mutate the enabledSmartTransactionsState source object', () => {
      expect(
        enabledSmartTransactionsState.engine.backgroundState
          .PreferencesController.smartTransactionsOptInStatus,
      ).toBe(true);
    });
  });
});
