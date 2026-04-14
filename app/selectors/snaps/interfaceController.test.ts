import { getMemoizedInterfaces, getInterface, getMemoizedInterface } from './interfaceController';

describe('Snap InterfaceController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        SnapInterfaceController: {
          interfaces: {
            'iface-1': { snapId: 'snap1', content: { type: 'panel' } },
            'iface-2': { snapId: 'snap2', content: { type: 'form' } },
          },
        },
      },
    },
  } as any;

  it('getMemoizedInterfaces should return all interfaces', () => {
    const result = getMemoizedInterfaces(mockState);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['iface-1'].snapId).toBe('snap1');
  });

  it('getInterface should return specific interface by id', () => {
    const result = getInterface(mockState, 'iface-1');
    expect(result.snapId).toBe('snap1');
  });

  it('getInterface should return undefined for unknown id', () => {
    const result = getInterface(mockState, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('getMemoizedInterface should return same result as getInterface', () => {
    const result = getMemoizedInterface(mockState, 'iface-2');
    expect(result.content.type).toBe('form');
  });
});
