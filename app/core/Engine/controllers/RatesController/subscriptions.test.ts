import {
  CurrencyRateControllerEvents,
  CurrencyRateState,
  RatesController,
} from '@metamask/assets-controllers';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import Logger from '../../../../util/Logger';
import { setupCurrencyRateSync } from './subscriptions';

jest.mock('../../../../util/Logger');

const buildCurrencyRateState = (
  currentCurrency: string,
): CurrencyRateState => ({
  currentCurrency,
  currencyRates: {},
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('setupCurrencyRateSync', () => {
  const arrangeMocks = () => {
    const baseMessenger = new ExtendedControllerMessenger<
      never,
      CurrencyRateControllerEvents
    >();
    const restrictedMessenger = baseMessenger.getRestricted({
      name: 'RatesController',
      allowedActions: [],
      allowedEvents: ['CurrencyRateController:stateChange'],
    });
    const mockSetFiatCurrency = jest.fn().mockResolvedValue(undefined);
    const ratesController = {
      setFiatCurrency: mockSetFiatCurrency,
    } as unknown as RatesController;

    setupCurrencyRateSync(restrictedMessenger, ratesController);

    const publishStateChange = (currentCurrency: string) =>
      baseMessenger.publish(
        'CurrencyRateController:stateChange',
        buildCurrencyRateState(currentCurrency),
        [],
      );

    return { mockSetFiatCurrency, publishStateChange };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs the selected fiat currency to the RatesController', async () => {
    const { mockSetFiatCurrency, publishStateChange } = arrangeMocks();

    publishStateChange('eur');
    await flushPromises();

    expect(mockSetFiatCurrency).toHaveBeenCalledTimes(1);
    expect(mockSetFiatCurrency).toHaveBeenCalledWith('eur');
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('syncs every subsequent currency change', async () => {
    const { mockSetFiatCurrency, publishStateChange } = arrangeMocks();

    publishStateChange('eur');
    publishStateChange('jpy');
    await flushPromises();

    expect(mockSetFiatCurrency).toHaveBeenCalledTimes(2);
    expect(mockSetFiatCurrency).toHaveBeenNthCalledWith(1, 'eur');
    expect(mockSetFiatCurrency).toHaveBeenNthCalledWith(2, 'jpy');
  });

  it('does not call setFiatCurrency when currentCurrency is empty', async () => {
    const { mockSetFiatCurrency, publishStateChange } = arrangeMocks();

    publishStateChange('');
    await flushPromises();

    expect(mockSetFiatCurrency).not.toHaveBeenCalled();
  });

  it('logs and swallows errors when setFiatCurrency rejects', async () => {
    const { mockSetFiatCurrency, publishStateChange } = arrangeMocks();
    const error = new Error('fetch failed');
    mockSetFiatCurrency.mockRejectedValueOnce(error);

    expect(() => publishStateChange('gbp')).not.toThrow();
    await flushPromises();

    expect(mockSetFiatCurrency).toHaveBeenCalledWith('gbp');
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'RatesController: Failed to sync fiat currency with CurrencyRateController',
    );
  });
});
