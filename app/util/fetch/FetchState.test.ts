import { FetchError, type FetchState } from './FetchState';

describe('FetchError', () => {
  it('is an instance of Error', () => {
    const err = new FetchError('nope');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FetchError);
  });

  it('stores the message and url', () => {
    const err = new FetchError('network error', 'https://example.com');
    expect(err.message).toBe('network error');
    expect(err.url).toBe('https://example.com');
  });

  it('supports being thrown without arguments', () => {
    expect(() => {
      throw new FetchError();
    }).toThrow(FetchError);
  });
});

describe('FetchState union', () => {
  it('supports Loading, Success and Error variants', () => {
    const loading: FetchState<number> = { type: 'Loading' };
    const success: FetchState<number> = { type: 'Success', data: 1 };
    const error: FetchState<number> = {
      type: 'Error',
      error: new FetchError('bad'),
    };
    expect(loading.type).toBe('Loading');
    expect(success.type).toBe('Success');
    expect(error.type).toBe('Error');
    expect((success as { data: number }).data).toBe(1);
  });
});
