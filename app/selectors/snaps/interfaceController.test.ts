import {
  getMemoizedInterfaces,
  getInterface,
  getMemoizedInterface,
} from './interfaceController';

const mockState = {
  engine: {
    backgroundState: {
      SnapInterfaceController: {
        interfaces: {
          'iface-1': { snapId: 'snap1', content: { type: 'panel' }, state: {} },
          'iface-2': { snapId: 'snap2', content: { type: 'form' }, state: {} },
        },
      },
    },
  },
} as any;

describe('interfaceController selectors', () => {
  it('getMemoizedInterfaces returns all interfaces', () => {
    const result = getMemoizedInterfaces(mockState);
    expect(result).toEqual(mockState.engine.backgroundState.SnapInterfaceController.interfaces);
  });

  it('getInterface returns specific interface by id', () => {
    const result = getInterface(mockState, 'iface-1');
    expect(result).toEqual({ snapId: 'snap1', content: { type: 'panel' }, state: {} });
  });

  it('getInterface returns undefined for non-existent id', () => {
    const result = getInterface(mockState, 'non-existent');
    expect(result).toBeUndefined();
  });

  it('getMemoizedInterface returns same as getInterface', () => {
    const result = getMemoizedInterface(mockState, 'iface-2');
    expect(result).toEqual({ snapId: 'snap2', content: { type: 'form' }, state: {} });
  });
});
