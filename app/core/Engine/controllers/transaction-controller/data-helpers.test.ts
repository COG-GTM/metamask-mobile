import {
  enabledSmartTransactionsState,
  disabledSmartTransactionsState,
} from './data-helpers';

describe('transaction-controller data-helpers', () => {
  describe('enabledSmartTransactionsState', () => {
    it('should have SmartTransactionsController enabled', () => {
      expect(
        enabledSmartTransactionsState.engine.backgroundState
          .SmartTransactionsController.enabled,
      ).toBe(true);
    });

    it('should have smartTransactionsOptInStatus true', () => {
      expect(
        enabledSmartTransactionsState.engine.backgroundState
          .PreferencesController.smartTransactionsOptInStatus,
      ).toBe(true);
    });

    it('should have liveness true', () => {
      expect(
        enabledSmartTransactionsState.engine.backgroundState
          .SmartTransactionsController.smartTransactionsState.liveness,
      ).toBe(true);
    });

    it('should have swaps feature flags enabled', () => {
      expect(
        enabledSmartTransactionsState.swaps.featureFlags.smart_transactions
          .mobile_active,
      ).toBe(true);
    });
  });

  describe('disabledSmartTransactionsState', () => {
    it('should have smartTransactionsOptInStatus false', () => {
      expect(
        disabledSmartTransactionsState.engine.backgroundState
          .PreferencesController.smartTransactionsOptInStatus,
      ).toBe(false);
    });

    it('should still have SmartTransactionsController enabled', () => {
      expect(
        disabledSmartTransactionsState.engine.backgroundState
          .SmartTransactionsController.enabled,
      ).toBe(true);
    });
  });
});
