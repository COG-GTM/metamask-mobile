import mmFirebase from './firebase';

describe('mmFirebase', () => {
  it('is a function and returns undefined without throwing', () => {
    expect(typeof mmFirebase).toBe('function');
    expect(mmFirebase()).toBeUndefined();
  });
});
