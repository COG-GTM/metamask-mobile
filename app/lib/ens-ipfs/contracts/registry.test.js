import registryAbi from './registry';

describe('ENS registry ABI', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(registryAbi)).toBe(true);
    expect(registryAbi.length).toBeGreaterThan(0);
  });

  it('includes required lookup entries: resolver, owner, ttl', () => {
    const names = registryAbi.map((entry) => entry.name);
    expect(names).toEqual(expect.arrayContaining(['resolver', 'owner', 'ttl']));
  });

  it('includes setter entries for owner, resolver, ttl, subnode owner', () => {
    const names = registryAbi.map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'setOwner',
        'setResolver',
        'setTTL',
        'setSubnodeOwner',
      ]),
    );
  });

  it('includes events: Transfer, NewOwner, NewResolver, NewTTL', () => {
    const events = registryAbi.filter((entry) => entry.type === 'event');
    const eventNames = events.map((entry) => entry.name);
    expect(eventNames).toEqual(
      expect.arrayContaining(['Transfer', 'NewOwner', 'NewResolver', 'NewTTL']),
    );
  });

  it('resolver entry accepts a bytes32 node and returns an address', () => {
    const resolverEntry = registryAbi.find(
      (entry) => entry.name === 'resolver',
    );
    expect(resolverEntry).toBeDefined();
    expect(resolverEntry.inputs).toEqual([{ name: 'node', type: 'bytes32' }]);
    expect(resolverEntry.outputs).toEqual([{ name: '', type: 'address' }]);
  });
});
