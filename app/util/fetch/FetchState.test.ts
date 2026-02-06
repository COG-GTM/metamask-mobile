import { FetchError, FetchState } from './FetchState';

describe('FetchError', () => {
  it('creates an error with message', () => {
    const error = new FetchError('Network error');
    expect(error.message).toBe('Network error');
    expect(error).toBeInstanceOf(Error);
  });

  it('creates an error with message and url', () => {
    const error = new FetchError('Network error', 'https://api.example.com');
    expect(error.message).toBe('Network error');
    expect(error.url).toBe('https://api.example.com');
  });

  it('creates an error without message', () => {
    const error = new FetchError();
    expect(error.message).toBe('');
    expect(error.url).toBeUndefined();
  });

  it('creates an error with only url', () => {
    const error = new FetchError(undefined, 'https://api.example.com');
    expect(error.message).toBe('');
    expect(error.url).toBe('https://api.example.com');
  });
});

describe('FetchState types', () => {
  it('can create a Loading state', () => {
    const loadingState: FetchState<string> = {
      type: 'Loading',
    };
    expect(loadingState.type).toBe('Loading');
  });

  it('can create a Loading state with data', () => {
    const loadingState: FetchState<string> = {
      type: 'Loading',
      data: 'cached data',
    };
    expect(loadingState.type).toBe('Loading');
    expect(loadingState.data).toBe('cached data');
  });

  it('can create a Success state', () => {
    const successState: FetchState<string> = {
      type: 'Success',
      data: 'fetched data',
    };
    expect(successState.type).toBe('Success');
    expect(successState.data).toBe('fetched data');
  });

  it('can create an Error state', () => {
    const errorState: FetchState<string> = {
      type: 'Error',
      error: new FetchError('Failed to fetch'),
      message: 'Something went wrong',
    };
    expect(errorState.type).toBe('Error');
    expect(errorState.error?.message).toBe('Failed to fetch');
    expect(errorState.message).toBe('Something went wrong');
  });

  it('can create an Error state with cached data', () => {
    const errorState: FetchState<string> = {
      type: 'Error',
      data: 'stale data',
      error: new FetchError('Network error'),
    };
    expect(errorState.type).toBe('Error');
    expect(errorState.data).toBe('stale data');
  });

  it('works with complex data types', () => {
    interface User {
      id: number;
      name: string;
    }
    const successState: FetchState<User> = {
      type: 'Success',
      data: { id: 1, name: 'John' },
    };
    expect(successState.type).toBe('Success');
    expect(successState.data).toEqual({ id: 1, name: 'John' });
  });

  it('works with array data types', () => {
    const successState: FetchState<number[]> = {
      type: 'Success',
      data: [1, 2, 3],
    };
    expect(successState.type).toBe('Success');
    expect(successState.data).toEqual([1, 2, 3]);
  });
});
