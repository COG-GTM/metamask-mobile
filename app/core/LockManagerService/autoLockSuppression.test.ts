import { isAutoLockSuppressed, suppressAutoLock } from './autoLockSuppression';

describe('autoLockSuppression', () => {
  it('is not suppressed by default', () => {
    expect(isAutoLockSuppressed()).toBe(false);
  });

  it('suppresses until released', () => {
    const release = suppressAutoLock();
    expect(isAutoLockSuppressed()).toBe(true);
    release();
    expect(isAutoLockSuppressed()).toBe(false);
  });

  it('reference counts overlapping suppressions', () => {
    const releaseA = suppressAutoLock();
    const releaseB = suppressAutoLock();
    releaseA();
    expect(isAutoLockSuppressed()).toBe(true);
    releaseB();
    expect(isAutoLockSuppressed()).toBe(false);
  });

  it('ignores repeated releases of the same suppression', () => {
    const releaseA = suppressAutoLock();
    const releaseB = suppressAutoLock();
    releaseA();
    releaseA();
    expect(isAutoLockSuppressed()).toBe(true);
    releaseB();
    expect(isAutoLockSuppressed()).toBe(false);
  });
});
