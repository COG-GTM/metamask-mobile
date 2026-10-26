import { FetchError, FetchState } from './FetchState';

describe('FetchError', () => {
  it('stores the message and url', () => {
    const error = new FetchError('Not found', 'https://example.com');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Not found');
    expect(error.url).toBe('https://example.com');
  });

  it('allows omitting the url', () => {
    const error = new FetchError('Oops');
    expect(error.url).toBeUndefined();
  });

  it('can be used in a FetchState', () => {
    const state: FetchState<string> = {
      type: 'Error',
      error: new FetchError('Oops'),
      message: 'Oops',
    };
    expect(state.type).toBe('Error');
  });
});
