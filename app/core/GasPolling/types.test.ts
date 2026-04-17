// Test that GasPolling types module can be imported
import * as types from './types';

describe('GasPolling types', () => {
  it('module exports are defined', () => {
    expect(types).toBeDefined();
    expect(typeof types).toBe('object');
  });
});
