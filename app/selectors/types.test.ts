import type { EngineState } from './types';

describe('selectors types', () => {
  it('EngineState type has engine with backgroundState', () => {
    // Type-level test: verify the type shape is correct
    const mockState: Partial<EngineState> = {
      engine: {
        backgroundState: {} as EngineState['engine']['backgroundState'],
      },
    };
    expect(mockState.engine).toBeDefined();
    expect(mockState.engine?.backgroundState).toBeDefined();
  });

  it('EngineState backgroundState includes expected controller states', () => {
    // This is a compile-time check; we verify the type structure
    type BgState = EngineState['engine']['backgroundState'];
    const controllers: (keyof BgState)[] = [
      'AccountTrackerController',
      'AddressBookController',
      'NftController',
      'TokenListController',
      'CurrencyRateController',
      'KeyringController',
      'NetworkController',
      'PreferencesController',
      'PhishingController',
      'TokenBalancesController',
      'TokenRatesController',
      'TransactionController',
      'GasFeeController',
      'TokensController',
      'ApprovalController',
      'AccountsController',
      'TokenSearchDiscoveryController',
    ];
    controllers.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });
});
