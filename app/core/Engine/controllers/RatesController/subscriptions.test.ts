import { setupCurrencyRateSync } from './subscriptions';
import Logger from '../../../../util/Logger';

jest.mock('../../../../util/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe('setupCurrencyRateSync', () => {
  const flushPromises = () => new Promise(setImmediate);

  beforeEach(() => {
    (Logger.error as jest.Mock).mockReset();
  });

  const makeMessengerAndGetHandler = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: ((state: any) => void) | undefined;
    const controllerMessenger = {
      subscribe: jest.fn((_: string, cb) => {
        handler = cb;
      }),
    };
    return { controllerMessenger, getHandler: () => handler };
  };

  it('subscribes to CurrencyRateController:stateChange', () => {
    const { controllerMessenger } = makeMessengerAndGetHandler();
    const ratesController = { setFiatCurrency: jest.fn().mockResolvedValue(undefined) };

    setupCurrencyRateSync(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controllerMessenger as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ratesController as any,
    );

    expect(controllerMessenger.subscribe).toHaveBeenCalledWith(
      'CurrencyRateController:stateChange',
      expect.any(Function),
    );
  });

  it('calls ratesController.setFiatCurrency when state includes currentCurrency', async () => {
    const { controllerMessenger, getHandler } = makeMessengerAndGetHandler();
    const ratesController = { setFiatCurrency: jest.fn().mockResolvedValue(undefined) };

    setupCurrencyRateSync(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controllerMessenger as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ratesController as any,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getHandler()!({ currentCurrency: 'usd' });

    expect(ratesController.setFiatCurrency).toHaveBeenCalledWith('usd');
  });

  it('does not call setFiatCurrency when currentCurrency is falsy', () => {
    const { controllerMessenger, getHandler } = makeMessengerAndGetHandler();
    const ratesController = { setFiatCurrency: jest.fn() };

    setupCurrencyRateSync(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controllerMessenger as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ratesController as any,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getHandler()!({ currentCurrency: '' });

    expect(ratesController.setFiatCurrency).not.toHaveBeenCalled();
  });

  it('logs errors when setFiatCurrency rejects', async () => {
    const { controllerMessenger, getHandler } = makeMessengerAndGetHandler();
    const error = new Error('boom');
    const ratesController = {
      setFiatCurrency: jest.fn().mockRejectedValue(error),
    };

    setupCurrencyRateSync(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controllerMessenger as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ratesController as any,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getHandler()!({ currentCurrency: 'eur' });
    await flushPromises();

    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'RatesController: Failed to sync fiat currency with CurrencyRateController',
    );
  });
});
