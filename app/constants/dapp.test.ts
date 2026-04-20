import { MAX_MESSAGE_LENGTH } from './dapp';

describe('dapp constants', () => {
  it('exports MAX_MESSAGE_LENGTH as a positive number', () => {
    expect(MAX_MESSAGE_LENGTH).toBe(1_000_000);
    expect(typeof MAX_MESSAGE_LENGTH).toBe('number');
  });
});
