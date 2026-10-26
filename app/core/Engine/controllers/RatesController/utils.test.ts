import { RatesController } from '@metamask/assets-controllers';
import { createMultichainRatesController } from './utils';
import Logger from '../../../../util/Logger';

jest.mock('@metamask/assets-controllers', () => ({
  RatesController: jest.fn(),
}));
jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

const MockRatesController = RatesController as unknown as jest.Mock;

describe('createMultichainRatesController', () => {
  const messenger = {} as Parameters<
    typeof createMultichainRatesController
  >[0]['messenger'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a controller with default state', () => {
    const controller = createMultichainRatesController({ messenger });
    expect(controller).toBeInstanceOf(MockRatesController);
    expect(MockRatesController).toHaveBeenCalledWith({
      messenger,
      state: {},
      includeUsdRate: true,
    });
  });

  it('passes the initial state', () => {
    const initialState = { fiatCurrency: 'eur' } as unknown as Parameters<
      typeof createMultichainRatesController
    >[0]['initialState'];
    createMultichainRatesController({ messenger, initialState });
    expect(MockRatesController).toHaveBeenCalledWith(
      expect.objectContaining({ state: initialState }),
    );
  });

  it('logs and rethrows initialization errors', () => {
    const error = new Error('init failed');
    MockRatesController.mockImplementationOnce(() => {
      throw error;
    });
    expect(() => createMultichainRatesController({ messenger })).toThrow(error);
    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'Failed to initialize RatesController',
    );
  });
});
