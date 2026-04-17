import {
  toLocaleDateTime,
  toLocaleDate,
  toLocaleTime,
  msBetweenDates,
  msToHours,
  formatTimestampToYYYYMMDD,
  getTimeDifferenceFromNow,
} from './index';

describe('date utils', () => {
  describe('toLocaleDateTime', () => {
    it('returns date and time string', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const result = toLocaleDateTime(timestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('toLocaleDate', () => {
    it('returns date string', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = toLocaleDate(timestamp);
      expect(typeof result).toBe('string');
    });
  });

  describe('toLocaleTime', () => {
    it('returns time string', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const result = toLocaleTime(timestamp);
      expect(typeof result).toBe('string');
    });
  });

  describe('msBetweenDates', () => {
    it('returns positive difference', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60);
      const result = msBetweenDates(pastDate);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('msToHours', () => {
    it('converts 3600000ms to 1 hour', () => {
      expect(msToHours(3600000)).toBe(1);
    });

    it('converts 7200000ms to 2 hours', () => {
      expect(msToHours(7200000)).toBe(2);
    });

    it('converts 0ms to 0 hours', () => {
      expect(msToHours(0)).toBe(0);
    });
  });

  describe('formatTimestampToYYYYMMDD', () => {
    it('formats timestamp correctly', () => {
      const timestamp = new Date('2024-03-15T00:00:00Z').getTime();
      const result = formatTimestampToYYYYMMDD(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTimeDifferenceFromNow', () => {
    it('returns zeros for past timestamp', () => {
      const past = Date.now() - 1000000;
      const result = getTimeDifferenceFromNow(past);
      expect(result).toEqual({ days: 0, hours: 0, minutes: 0 });
    });

    it('returns positive values for future timestamp', () => {
      const future = Date.now() + 1000 * 60 * 60 * 25 + 1000; // 25 hours + 1s buffer from now
      const result = getTimeDifferenceFromNow(future);
      expect(result.days).toBe(1);
      expect(result.hours).toBe(1);
    });
  });
});
