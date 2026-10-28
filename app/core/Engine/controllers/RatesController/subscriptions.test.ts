import { Messenger } from '@metamask/base-controller';
import type {
  CurrencyRateState,
  RatesController,
} from '@metamask/assets-controllers';
import Logger from '../../../../util/Logger';
import { setupCurrencyRateSync } from './subscriptions';

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

const buildCurrencyRateState = (
  overrides: Partial<CurrencyRateState> = {},
): CurrencyRateState => ({
  currentCurrency: 'usd',
  currencyRates: {
    ETH: {
      conversionDate: 1,
      conversionRate: 2000,
      usdConversionRate: 2000,
    },
  },
  ...overrides,
});

const setup = (fiatCurrency = 'usd') => {
  const messenger = new Messenger<
    never,
    {
      type: 'CurrencyRateController:stateChange';
      payload: [CurrencyRateState, []];
    }
  >();
  const ratesController = {
    state: { fiatCurrency },
    setFiatCurrency: jest.fn(async (currency: string) => {
      ratesController.state.fiatCurrency = currency;
    }),
  };
  setupCurrencyRateSync(
    messenger.getRestricted({
      name: 'RatesController',
      allowedActions: [],
      allowedEvents: ['CurrencyRateController:stateChange'],
    }) as unknown as Parameters<typeof setupCurrencyRateSync>[0],
    ratesController as unknown as RatesController,
  );
  const publish = (state: CurrencyRateState) =>
    messenger.publish('CurrencyRateController:stateChange', state, []);
  return { ratesController, publish };
};

describe('setupCurrencyRateSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call setFiatCurrency when currentCurrency is unchanged', () => {
    const { ratesController, publish } = setup('usd');

    publish(buildCurrencyRateState());
    publish(
      buildCurrencyRateState({
        currencyRates: {
          ETH: {
            conversionDate: 2,
            conversionRate: 2100,
            usdConversionRate: 2100,
          },
        },
      }),
    );

    expect(ratesController.setFiatCurrency).not.toHaveBeenCalled();
  });

  it('calls setFiatCurrency once when currentCurrency changes', async () => {
    const { ratesController, publish } = setup('usd');

    publish(buildCurrencyRateState({ currentCurrency: 'eur' }));
    await Promise.resolve();
    publish(
      buildCurrencyRateState({
        currentCurrency: 'eur',
        currencyRates: {},
      }),
    );

    expect(ratesController.setFiatCurrency).toHaveBeenCalledTimes(1);
    expect(ratesController.setFiatCurrency).toHaveBeenCalledWith('eur');
  });

  it('ignores an empty currentCurrency', () => {
    const { ratesController, publish } = setup('usd');

    publish(buildCurrencyRateState({ currentCurrency: '' }));

    expect(ratesController.setFiatCurrency).not.toHaveBeenCalled();
  });

  it('logs when setFiatCurrency rejects', async () => {
    const { ratesController, publish } = setup('usd');
    const error = new Error('network');
    ratesController.setFiatCurrency.mockRejectedValueOnce(error);

    publish(buildCurrencyRateState({ currentCurrency: 'gbp' }));
    await new Promise(process.nextTick);

    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'RatesController: Failed to sync fiat currency with CurrencyRateController',
    );
  });
});
