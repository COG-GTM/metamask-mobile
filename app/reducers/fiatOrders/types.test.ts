// Test that fiatOrders types module can be imported
import * as types from './types';

describe('fiatOrders types', () => {
  it('module exports are defined', () => {
    expect(types).toBeDefined();
    expect(typeof types).toBe('object');
  });
});
