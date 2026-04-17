import { createOriginMiddleware, containsUserRejectedError } from './middlewares';

describe('middlewares', () => {
  describe('createOriginMiddleware', () => {
    it('sets origin on request', () => {
      const middleware = createOriginMiddleware({ origin: 'https://test.com' });
      const req = {};
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.origin).toBe('https://test.com');
      expect(next).toHaveBeenCalled();
    });

    it('initializes empty params if not present', () => {
      const middleware = createOriginMiddleware({ origin: 'test' });
      const req = {};
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.params).toEqual([]);
    });

    it('does not overwrite existing params', () => {
      const middleware = createOriginMiddleware({ origin: 'test' });
      const req = { params: [1, 2] };
      const next = jest.fn();
      middleware(req, {}, next);
      expect(req.params).toEqual([1, 2]);
    });
  });

  describe('containsUserRejectedError', () => {
    it('returns true for user rejected message', () => {
      expect(containsUserRejectedError('User rejected the transaction')).toBe(true);
    });

    it('returns true for user denied message', () => {
      expect(containsUserRejectedError('User denied message signature')).toBe(true);
    });

    it('returns true for user cancelled message', () => {
      expect(containsUserRejectedError('User cancelled the request')).toBe(true);
    });

    it('returns true for error code 4001', () => {
      expect(containsUserRejectedError('some error', 4001)).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(containsUserRejectedError('gas limit exceeded')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(containsUserRejectedError('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(containsUserRejectedError(null)).toBe(false);
    });

    it('returns false for non-string', () => {
      expect(containsUserRejectedError(123)).toBe(false);
    });
  });
});
