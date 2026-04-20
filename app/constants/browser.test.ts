import { EXTERNAL_LINK_TYPE } from './browser';

describe('browser constants', () => {
  it('exports EXTERNAL_LINK_TYPE as a string', () => {
    expect(EXTERNAL_LINK_TYPE).toBe('external-link');
  });
});
