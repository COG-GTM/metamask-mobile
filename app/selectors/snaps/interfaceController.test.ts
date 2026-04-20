import {
  getInterface,
  getMemoizedInterface,
  getMemoizedInterfaces,
} from './interfaceController';
import type { RootState } from '../../reducers';

const makeState = (interfaces: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        SnapInterfaceController: { interfaces },
      },
    },
  } as unknown as RootState);

describe('snaps/interfaceController selectors', () => {
  const interfaceA = { id: 'a', content: { type: 'Text', value: 'hi' } };
  const interfaceB = { id: 'b' };
  const state = makeState({ a: interfaceA, b: interfaceB });

  it('getMemoizedInterfaces returns the interfaces map', () => {
    expect(getMemoizedInterfaces(state)).toEqual({
      a: interfaceA,
      b: interfaceB,
    });
  });

  it('getInterface returns the specific interface by id', () => {
    expect(getInterface(state, 'a')).toBe(interfaceA);
    expect(getInterface(state, 'b')).toBe(interfaceB);
  });

  it('getInterface returns undefined for an unknown id', () => {
    expect(getInterface(state, 'missing')).toBeUndefined();
  });

  it('getMemoizedInterface returns the same value as getInterface', () => {
    expect(getMemoizedInterface(state, 'a')).toEqual(
      getInterface(state, 'a'),
    );
  });
});
