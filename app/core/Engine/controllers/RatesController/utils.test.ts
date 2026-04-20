import { RatesController } from '@metamask/assets-controllers';
import { createMultichainRatesController } from './utils';
import Logger from '../../../../util/Logger';

jest.mock('@metamask/assets-controllers', () => ({
  RatesController: jest.fn(),
}));

jest.mock('../../../../util/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe('createMultichainRatesController', () => {
  const MockRatesController = RatesController as unknown as jest.Mock;

  beforeEach(() => {
    MockRatesController.mockReset();
    (Logger.error as jest.Mock).mockReset();
  });

  it('instantiates RatesController with includeUsdRate and default initialState', () => {
    const messenger = { id: 'messenger' };
    MockRatesController.mockImplementation(() => ({ fake: 'instance' }));

    const result = createMultichainRatesController({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: messenger as any,
    });

    expect(MockRatesController).toHaveBeenCalledWith({
      messenger,
      state: {},
      includeUsdRate: true,
    });
    expect(result).toEqual({ fake: 'instance' });
  });

  it('passes through a provided initialState', () => {
    MockRatesController.mockImplementation(() => ({}));
    const messenger = { id: 'messenger' };
    const initialState = { fiatCurrency: 'usd', rates: {}, cryptocurrencies: [] };

    createMultichainRatesController({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: messenger as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialState: initialState as any,
    });

    expect(MockRatesController).toHaveBeenCalledWith({
      messenger,
      state: initialState,
      includeUsdRate: true,
    });
  });

  it('logs and rethrows when construction fails', () => {
    const error = new Error('boom');
    MockRatesController.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      createMultichainRatesController({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messenger: {} as any,
      }),
    ).toThrow(error);

    expect(Logger.error).toHaveBeenCalledWith(
      error,
      'Failed to initialize RatesController',
    );
  });
});
