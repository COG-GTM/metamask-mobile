import { RatesControllerStateChangeEvent } from './constants';

describe('RatesController constants', () => {
  it('should export the correct state change event name', () => {
    expect(RatesControllerStateChangeEvent).toBe(
      'RatesController:stateChange',
    );
  });

  it('should be a string type', () => {
    expect(typeof RatesControllerStateChangeEvent).toBe('string');
  });
});
