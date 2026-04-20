import mmAuth from './auth';

describe('mmAuth', () => {
  it('is a function and returns undefined without throwing', () => {
    expect(typeof mmAuth).toBe('function');
    expect(mmAuth()).toBeUndefined();
  });
});
