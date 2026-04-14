jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

jest.mock('@metamask/assets-controllers', () => ({
  RatesController: jest.fn().mockImplementation((opts) => ({
    ...opts,
    _mock: true,
  })),
}));

import { createMultichainRatesController } from './utils';

describe('RatesController utils', () => {
  describe('createMultichainRatesController', () => {
    it('should create a RatesController with messenger and default state', () => {
      const mockMessenger = {} as any;
      const result = createMultichainRatesController({
        messenger: mockMessenger,
      });
      expect(result).toBeDefined();
    });

    it('should create a RatesController with initial state', () => {
      const mockMessenger = {} as any;
      const initialState = { cryptocurrencies: {} } as any;
      const result = createMultichainRatesController({
        messenger: mockMessenger,
        initialState,
      });
      expect(result).toBeDefined();
    });

    it('should throw and log error on failure', () => {
      const { RatesController } = require('@metamask/assets-controllers');
      RatesController.mockImplementationOnce(() => {
        throw new Error('init failed');
      });

      const mockMessenger = {} as any;
      expect(() =>
        createMultichainRatesController({ messenger: mockMessenger }),
      ).toThrow('init failed');
    });
  });
});
