import { SECOND, MINUTE, HOUR, DAY } from './time';

describe('time constants', () => {
  it('defines SECOND as 1000ms', () => {
    expect(SECOND).toBe(1000);
  });

  it('defines MINUTE as 60 seconds', () => {
    expect(MINUTE).toBe(60 * 1000);
  });

  it('defines HOUR as 60 minutes', () => {
    expect(HOUR).toBe(60 * 60 * 1000);
  });

  it('defines DAY as 24 hours', () => {
    expect(DAY).toBe(24 * 60 * 60 * 1000);
  });
});
