import { createOriginMiddleware, containsUserRejectedError, createLoggerMiddleware } from './middlewares';

jest.mock('./Logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

jest.mock('./metrics/TrackError/trackErrorAsAnalytics', () => jest.fn());

describe('middlewares', () => {
  describe('createOriginMiddleware', () => {
    it('should set origin on request', () => {
      const middleware = createOriginMiddleware({ origin: 'https://example.com' });
      const req = {};
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.origin).toBe('https://example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should add empty params if missing', () => {
      const middleware = createOriginMiddleware({ origin: 'test' });
      const req = {};
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.params).toEqual([]);
    });
  });

  describe('containsUserRejectedError', () => {
    it('should return true for user rejected messages', () => {
      expect(containsUserRejectedError('User rejected the transaction')).toBe(true);
      expect(containsUserRejectedError('User denied message signature')).toBe(true);
      expect(containsUserRejectedError('User cancelled the transaction')).toBe(true);
    });

    it('should return false for non-rejection errors', () => {
      expect(containsUserRejectedError('gas required exceeds allowance')).toBe(false);
    });

    it('should return true for error code 4001', () => {
      expect(containsUserRejectedError('some error', 4001)).toBe(true);
    });

    it('should return false for null or non-string input', () => {
      expect(containsUserRejectedError(null)).toBe(false);
      expect(containsUserRejectedError(123)).toBe(false);
    });
  });

  describe('createLoggerMiddleware', () => {
    it('should return a function', () => {
      const middleware = createLoggerMiddleware({ origin: 'test' });
      expect(typeof middleware).toBe('function');
    });
  });
});
