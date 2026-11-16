import {
  CurrencyRateControllerEvents,
  CurrencyRateState,
  RatesController,
} from '@metamask/assets-controllers';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import Logger from '../../../../util/Logger';
import { setupCurrencyRateSync } from './subscriptions';

jest.mock('../../../../util/Logger');

type SetupMessenger = Parameters<typeof setupCurrencyRateSync>[0];

const buildCurrencyRateState = (
  overrides: Partial<CurrencyRateState> = {},
): CurrencyRateState => ({
  currentCurrency: 'usd',
  currencyRates: {},
  ...overrides,
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('setupCurrencyRateSync', () => {
  let baseMessenger: ExtendedControllerMessenger<
    never,
    CurrencyRateControllerEvents
  >;
  let setFiatCurrency: jest.Mock;
  let ratesController: RatesController;

  const publishCurrencyRateStateChange = (state: CurrencyRateState) =>
    baseMessenger.publish('CurrencyRateController:stateChange', state, []);

  beforeEach(() => {
    jest.clearAllMocks();
    baseMessenger = new ExtendedControllerMessenger();
    setFiatCurrency = jest.fn().mockResolvedValue(undefined);
    ratesController = { setFiatCurrency } as unknown as RatesController;

    const restrictedMessenger = baseMessenger.getRestricted({
      name: 'RatesController',
      allowedActions: [],
      allowedEvents: ['CurrencyRateController:stateChange'],
    });

    setupCurrencyRateSync(
      restrictedMessenger as unknown as SetupMessenger,
      ratesController,
    );
  });

  it('does not call setFiatCurrency before any state change is published', () => {
    expect(setFiatCurrency).not.toHaveBeenCalled();
  });

  it('syncs the fiat currency when CurrencyRateController currentCurrency changes', async () => {
    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: 'eur' }),
    );
    await flushPromises();

    expect(setFiatCurrency).toHaveBeenCalledTimes(1);
    expect(setFiatCurrency).toHaveBeenCalledWith('eur');
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('syncs every published currency in order', async () => {
    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: 'eur' }),
    );
    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: 'jpy' }),
    );
    await flushPromises();

    expect(setFiatCurrency.mock.calls).toEqual([['eur'], ['jpy']]);
  });

  it('does not call setFiatCurrency when currentCurrency is empty', async () => {
    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: '' }),
    );
    await flushPromises();

    expect(setFiatCurrency).not.toHaveBeenCalled();
  });

  it('logs and swallows a rejected setFiatCurrency', async () => {
    const error = new Error('fetch failed');
    setFiatCurrency.mockRejectedValueOnce(error);

    expect(() =>
      publishCurrencyRateStateChange(
        buildCurrencyRateState({ currentCurrency: 'eur' }),
      ),
    ).not.toThrow();
    await flushPromises();

    expect(setFiatCurrency).toHaveBeenCalledWith('eur');
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'RatesController: Failed to sync fiat currency with CurrencyRateController',
    );
  });

  it('keeps syncing after a previous setFiatCurrency rejection', async () => {
    setFiatCurrency.mockRejectedValueOnce(new Error('fetch failed'));

    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: 'eur' }),
    );
    await flushPromises();
    publishCurrencyRateStateChange(
      buildCurrencyRateState({ currentCurrency: 'gbp' }),
    );
    await flushPromises();

    expect(setFiatCurrency.mock.calls).toEqual([['eur'], ['gbp']]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });
});
