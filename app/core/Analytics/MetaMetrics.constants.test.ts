import METAMETRICS_ANONYMOUS_ID from './MetaMetrics.constants';
import { METAMETRICS_ANONYMOUS_ID as namedExport } from './MetaMetrics.constants';

describe('MetaMetrics.constants', () => {
  it('should export the anonymous ID as default', () => {
    expect(METAMETRICS_ANONYMOUS_ID).toBe('0x0000000000000000');
  });

  it('should export the anonymous ID as named export', () => {
    expect(namedExport).toBe('0x0000000000000000');
  });

  it('should be a string type', () => {
    expect(typeof METAMETRICS_ANONYMOUS_ID).toBe('string');
  });
});
