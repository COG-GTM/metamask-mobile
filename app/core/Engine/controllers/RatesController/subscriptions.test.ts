import { setupCurrencyRateSync } from './subscriptions';

jest.mock('../../../../util/Logger', () => ({
  error: jest.fn(),
}));

describe('RatesController subscriptions', () => {
  describe('setupCurrencyRateSync', () => {
    it('should subscribe to CurrencyRateController:stateChange', () => {
      const mockSubscribe = jest.fn();
      const mockMessenger = { subscribe: mockSubscribe } as any;
      const mockRatesController = {
        setFiatCurrency: jest.fn().mockResolvedValue(undefined),
      } as any;

      setupCurrencyRateSync(mockMessenger, mockRatesController);

      expect(mockSubscribe).toHaveBeenCalledWith(
        'CurrencyRateController:stateChange',
        expect.any(Function),
      );
    });

    it('should call setFiatCurrency when state has currentCurrency', () => {
      const mockSubscribe = jest.fn();
      const mockMessenger = { subscribe: mockSubscribe } as any;
      const mockRatesController = {
        setFiatCurrency: jest.fn().mockResolvedValue(undefined),
      } as any;

      setupCurrencyRateSync(mockMessenger, mockRatesController);

      const callback = mockSubscribe.mock.calls[0][1];
      callback({ currentCurrency: 'usd' });

      expect(mockRatesController.setFiatCurrency).toHaveBeenCalledWith('usd');
    });

    it('should not call setFiatCurrency when currentCurrency is empty', () => {
      const mockSubscribe = jest.fn();
      const mockMessenger = { subscribe: mockSubscribe } as any;
      const mockRatesController = {
        setFiatCurrency: jest.fn(),
      } as any;

      setupCurrencyRateSync(mockMessenger, mockRatesController);

      const callback = mockSubscribe.mock.calls[0][1];
      callback({ currentCurrency: '' });

      expect(mockRatesController.setFiatCurrency).not.toHaveBeenCalled();
    });
  });
});
