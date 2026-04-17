import { FetchError, FetchState } from './FetchState';

describe('FetchState', () => {
  describe('FetchError', () => {
    it('creates error with message', () => {
      const error = new FetchError('test error');
      expect(error.message).toBe('test error');
      expect(error).toBeInstanceOf(Error);
    });

    it('creates error with message and url', () => {
      const error = new FetchError('test error', 'https://example.com');
      expect(error.message).toBe('test error');
      expect(error.url).toBe('https://example.com');
    });

    it('creates error without arguments', () => {
      const error = new FetchError();
      expect(error).toBeInstanceOf(Error);
    });

    it('is instance of Error', () => {
      const error = new FetchError('test');
      expect(error).toBeInstanceOf(FetchError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('FetchState type', () => {
    it('can represent Loading state', () => {
      const state: FetchState<string> = { type: 'Loading' };
      expect(state.type).toBe('Loading');
    });

    it('can represent Loading state with data', () => {
      const state: FetchState<string> = { type: 'Loading', data: 'cached' };
      expect(state.type).toBe('Loading');
      expect(state.data).toBe('cached');
    });

    it('can represent Success state', () => {
      const state: FetchState<string> = { type: 'Success', data: 'result' };
      expect(state.type).toBe('Success');
      expect(state.data).toBe('result');
    });

    it('can represent Error state', () => {
      const state: FetchState<string> = {
        type: 'Error',
        error: new FetchError('fail'),
        message: 'something went wrong',
      };
      expect(state.type).toBe('Error');
      expect(state.error?.message).toBe('fail');
      expect(state.message).toBe('something went wrong');
    });
  });
});
