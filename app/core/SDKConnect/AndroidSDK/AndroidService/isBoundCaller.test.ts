import isBoundCaller from './isBoundCaller';

describe('isBoundCaller', () => {
  it('accepts the package the connection is bound to', () => {
    expect(isBoundCaller({ callerPackage: 'io.dapp' }, 'io.dapp')).toBe(true);
  });

  it('rejects a different package', () => {
    expect(isBoundCaller({ callerPackage: 'io.dapp' }, 'io.attacker')).toBe(
      false,
    );
  });

  it('rejects legacy connections with no bound package', () => {
    expect(isBoundCaller({}, 'io.dapp')).toBe(false);
  });

  it('rejects messages without a caller package', () => {
    expect(isBoundCaller({ callerPackage: 'io.dapp' }, undefined)).toBe(false);
  });

  it('rejects unknown connections', () => {
    expect(isBoundCaller(undefined, 'io.dapp')).toBe(false);
  });
});
