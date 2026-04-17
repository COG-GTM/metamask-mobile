import { generateOpt } from './MetaMetrics.events';

describe('MetaMetrics.events', () => {
  describe('generateOpt', () => {
    it('returns category only when no action or description', () => {
      const result = generateOpt('App Opened' as any);
      expect(result).toEqual({ category: 'App Opened' });
    });

    it('returns category with action', () => {
      const result = generateOpt('App Opened' as any, 'clicked' as any);
      expect(result).toEqual({
        category: 'App Opened',
        properties: { action: 'clicked' },
      });
    });

    it('returns category with description', () => {
      const result = generateOpt('App Opened' as any, undefined, 'description' as any);
      expect(result).toEqual({
        category: 'App Opened',
        properties: { name: 'description' },
      });
    });

    it('returns category with action and description', () => {
      const result = generateOpt('App Opened' as any, 'clicked' as any, 'desc' as any);
      expect(result).toEqual({
        category: 'App Opened',
        properties: { action: 'clicked', name: 'desc' },
      });
    });
  });
});
