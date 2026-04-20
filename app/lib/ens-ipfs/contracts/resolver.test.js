import resolverAbi from './resolver';

describe('ENS resolver ABI', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(resolverAbi)).toBe(true);
    expect(resolverAbi.length).toBeGreaterThan(0);
  });

  it('includes standard resolver getters', () => {
    const names = resolverAbi.map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'addr',
        'content',
        'contenthash',
        'name',
        'pubkey',
        'text',
        'ABI',
        'supportsInterface',
      ]),
    );
  });

  it('includes setters for addr, content, contenthash, name, text, pubkey, ABI', () => {
    const names = resolverAbi.map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'setAddr',
        'setContent',
        'setContenthash',
        'setName',
        'setText',
        'setPubkey',
        'setABI',
      ]),
    );
  });

  it('includes a constructor entry taking an ENS address', () => {
    const constructor = resolverAbi.find(
      (entry) => entry.type === 'constructor',
    );
    expect(constructor).toBeDefined();
    expect(constructor.inputs).toEqual([
      { name: 'ensAddr', type: 'address' },
    ]);
  });

  it('includes expected events', () => {
    const events = resolverAbi
      .filter((entry) => entry.type === 'event')
      .map((entry) => entry.name);
    expect(events).toEqual(
      expect.arrayContaining([
        'AddrChanged',
        'NameChanged',
        'ABIChanged',
        'PubkeyChanged',
        'TextChanged',
        'ContenthashChanged',
      ]),
    );
  });
});
