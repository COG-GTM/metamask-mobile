// Test that key type exports from Engine types are properly exported
import type {
  EngineState,
  Controllers,
  EngineContext,
  ControllerName,
  Controller,
  StatefulControllers,
  BaseControllerMessenger,
  BaseRestrictedControllerMessenger,
} from './types';

describe('Engine types', () => {
  it('ControllerName is a string key of Controllers', () => {
    // Type-level test: verify the type is correct at compile time
    const name: ControllerName = 'AccountsController';
    expect(name).toBe('AccountsController');
  });

  it('ControllerName includes expected controller names', () => {
    const names: ControllerName[] = [
      'AccountsController',
      'NetworkController',
      'KeyringController',
      'PreferencesController',
      'TransactionController',
      'TokensController',
      'GasFeeController',
      'ApprovalController',
      'PhishingController',
      'NftController',
      'TokenListController',
      'CurrencyRateController',
      'TokenRatesController',
      'TokenBalancesController',
      'SignatureController',
      'LoggingController',
      'AddressBookController',
      'SwapsController',
      'SelectedNetworkController',
      'SmartTransactionsController',
      'RemoteFeatureFlagController',
    ];
    names.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('type definitions exist and are importable', () => {
    // These are compile-time checks to ensure types are exported
    // If these fail, the test file won't compile
    const typeChecks = {
      EngineState: true as EngineState extends object ? true : false,
      Controllers: true as Controllers extends object ? true : false,
      ControllerName: true as ControllerName extends string ? true : false,
    };
    expect(typeChecks.EngineState).toBe(true);
    expect(typeChecks.Controllers).toBe(true);
    expect(typeChecks.ControllerName).toBe(true);
  });
});
