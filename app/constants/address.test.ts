import TEST_ADDRESS from './address';

describe('address constants', () => {
  it('exports a valid Ethereum address', () => {
    expect(TEST_ADDRESS).toBeDefined();
    expect(TEST_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
