import {
  RatesController,
  RatesControllerMessenger,
  RatesControllerState,
} from '@metamask/assets-controllers';
import Logger from '../../../../util/Logger';
import { createMultichainRatesController } from './utils';

jest.mock('@metamask/assets-controllers');
jest.mock('../../../../util/Logger');

describe('createMultichainRatesController', () => {
  const ratesControllerClassMock = jest.mocked(RatesController);
  const messenger = {} as unknown as RatesControllerMessenger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the controller with an empty state and includeUsdRate when no initial state is provided', () => {
    const controller = createMultichainRatesController({ messenger });

    expect(ratesControllerClassMock).toHaveBeenCalledTimes(1);
    expect(ratesControllerClassMock).toHaveBeenCalledWith({
      messenger,
      state: {},
      includeUsdRate: true,
    });
    expect(controller).toBe(ratesControllerClassMock.mock.instances[0]);
  });

  it('passes the persisted initial state through to the controller', () => {
    const initialState: RatesControllerState = {
      fiatCurrency: 'eur',
      cryptocurrencies: [
        'btc',
        'sol',
      ] as RatesControllerState['cryptocurrencies'],
      rates: {
        btc: {
          conversionRate: 50000,
          usdConversionRate: 55000,
          conversionDate: 1,
        },
        sol: { conversionRate: 100, usdConversionRate: 110, conversionDate: 1 },
      },
    };

    createMultichainRatesController({ messenger, initialState });

    expect(ratesControllerClassMock).toHaveBeenCalledWith({
      messenger,
      state: initialState,
      includeUsdRate: true,
    });
    expect(ratesControllerClassMock.mock.calls[0][0].state).toBe(initialState);
  });

  it('logs and rethrows when the controller constructor throws', () => {
    const error = new Error('constructor failed');
    ratesControllerClassMock.mockImplementationOnce(() => {
      throw error;
    });

    expect(() => createMultichainRatesController({ messenger })).toThrow(error);
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'Failed to initialize RatesController',
    );
  });
});
