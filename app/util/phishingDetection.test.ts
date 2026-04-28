import {
  PhishingController,
  PhishingDetectorResult,
  PhishingDetectorResultType,
  RecommendedAction,
} from '@metamask/phishing-controller';
import Engine from '../core/Engine';
import {
  getPhishingTestResult,
  getPhishingTestResultAsync,
} from './phishingDetection';

jest.mock('../core/Engine', () => ({
  context: {
    PhishingController: {
      maybeUpdateState: jest.fn(),
      test: jest.fn(),
    },
  },
}));

describe('Phishing Detection', () => {
  const mockPhishingController = Engine.context.PhishingController as jest.Mocked<PhishingController>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhishingTestResult', () => {
    it('should call maybeUpdateState and test with the provided origin', () => {
      const testOrigin = 'https://example.com';
      getPhishingTestResult(testOrigin);
      expect(mockPhishingController.maybeUpdateState).toHaveBeenCalledTimes(1);
      expect(mockPhishingController.test).toHaveBeenCalledWith(testOrigin);
    });

    it('should return the result from PhishingController.test', () => {
      const testOrigin = 'https://example.com';
      const mockResult: PhishingDetectorResult = {
        result: false,
        name: 'MetaMask',
        version: '1.0.0',
        type: PhishingDetectorResultType.All,
      };

      mockPhishingController.test.mockReturnValueOnce(mockResult);
      const result = getPhishingTestResult(testOrigin);

      expect(result).toEqual(mockResult);
    });
  });

  describe('getPhishingTestResultAsync', () => {
    beforeEach(() => {
      mockPhishingController.scanUrl = jest.fn();
    });

    it('should call scanUrl with the provided origin', async () => {
      const testOrigin = 'https://example.com';

      mockPhishingController.scanUrl.mockResolvedValue({
        recommendedAction: RecommendedAction.None,
        domainName: testOrigin,
      });

      const result = await getPhishingTestResultAsync(testOrigin);

      expect(mockPhishingController.scanUrl).toHaveBeenCalledWith(testOrigin);
      expect(result).toEqual({
        result: false,
        name: 'Product safety dapp scanning is enabled',
        type: 'DAPP_SCANNING',
      });
    });

    it('returns result=false when recommendedAction is None', async () => {
      mockPhishingController.scanUrl.mockResolvedValue({
        recommendedAction: RecommendedAction.None,
        domainName: 'example.com',
      });

      const result = await getPhishingTestResultAsync('example.com');
      expect(result.result).toBe(false);
    });

    it('returns result=false when recommendedAction is Warn', async () => {
      mockPhishingController.scanUrl.mockResolvedValue({
        recommendedAction: RecommendedAction.Warn,
        domainName: 'example.com',
      });

      const result = await getPhishingTestResultAsync('example.com');
      expect(result.result).toBe(false);
    });

    it('returns result=true when recommendedAction is Block', async () => {
      mockPhishingController.scanUrl.mockResolvedValue({
        recommendedAction: RecommendedAction.Block,
        domainName: 'example.com',
      });

      const result = await getPhishingTestResultAsync('example.com');
      expect(result.result).toBe(true);
    });
  });
});
