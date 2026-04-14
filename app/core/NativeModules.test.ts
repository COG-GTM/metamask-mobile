import { Minimizer } from './NativeModules';

describe('NativeModules', () => {
  it('should export Minimizer', () => {
    expect(Minimizer).toBeDefined();
  });
});
