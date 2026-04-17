import { UNSUPPORTED_RPC_METHODS, makeMethodMiddlewareMaker } from './utils';

describe('RPCMethods utils', () => {
  describe('UNSUPPORTED_RPC_METHODS', () => {
    it('is a Set', () => {
      expect(UNSUPPORTED_RPC_METHODS).toBeInstanceOf(Set);
    });

    it('contains eth_signTransaction', () => {
      expect(UNSUPPORTED_RPC_METHODS.has('eth_signTransaction')).toBe(true);
    });

    it('does not contain eth_sendTransaction', () => {
      expect(UNSUPPORTED_RPC_METHODS.has('eth_sendTransaction')).toBe(false);
    });
  });

  describe('makeMethodMiddlewareMaker', () => {
    it('returns a function', () => {
      const maker = makeMethodMiddlewareMaker([]);
      expect(typeof maker).toBe('function');
    });

    it('creates middleware from empty handlers', () => {
      const maker = makeMethodMiddlewareMaker([]);
      const middleware = maker({});
      expect(typeof middleware).toBe('function');
    });

    it('middleware calls next for unknown methods', async () => {
      const maker = makeMethodMiddlewareMaker([]);
      const middleware = maker({});
      const req = { method: 'unknown_method' };
      const res = {};
      const next = jest.fn();
      const end = jest.fn();
      await middleware(req as any, res as any, next, end);
      expect(next).toHaveBeenCalled();
      expect(end).not.toHaveBeenCalled();
    });

    it('throws for missing hooks', () => {
      const handler = {
        methodNames: ['test_method'],
        implementation: jest.fn(),
        hookNames: { testHook: true },
      };
      const maker = makeMethodMiddlewareMaker([handler as any]);
      expect(() => maker({})).toThrow('Missing expected hooks');
    });

    it('throws for extraneous hooks', () => {
      const handler = {
        methodNames: ['test_method'],
        implementation: jest.fn(),
        hookNames: { testHook: true },
      };
      const maker = makeMethodMiddlewareMaker([handler as any]);
      expect(() => maker({ testHook: jest.fn(), extraHook: jest.fn() })).toThrow('Received unexpected hooks');
    });
  });
});
