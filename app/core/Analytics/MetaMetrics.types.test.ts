import {
  isTrackingEvent,
  DataDeleteStatus,
  DataDeleteResponseStatus,
} from './MetaMetrics.types';

describe('MetaMetrics.types', () => {
  describe('isTrackingEvent', () => {
    it('returns true for ITrackingEvent', () => {
      const event = {
        name: 'test',
        properties: {},
        sensitiveProperties: {},
        saveDataRecording: true,
      };
      expect(isTrackingEvent(event as any)).toBe(true);
    });

    it('returns false for IMetaMetricsEvent', () => {
      const event = { category: 'test' };
      expect(isTrackingEvent(event as any)).toBe(false);
    });
  });

  describe('DataDeleteStatus', () => {
    it('has expected values', () => {
      expect(DataDeleteStatus.failed).toBe('FAILED');
      expect(DataDeleteStatus.finished).toBe('FINISHED');
      expect(DataDeleteStatus.initialized).toBe('INITIALIZED');
      expect(DataDeleteStatus.invalid).toBe('INVALID');
      expect(DataDeleteStatus.running).toBe('RUNNING');
      expect(DataDeleteStatus.unknown).toBe('UNKNOWN');
    });
  });

  describe('DataDeleteResponseStatus', () => {
    it('has expected values', () => {
      expect(DataDeleteResponseStatus.ok).toBe('ok');
      expect(DataDeleteResponseStatus.error).toBe('error');
    });
  });
});
