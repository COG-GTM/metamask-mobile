import type { Compute } from './type-utils';

describe('Compute type utility', () => {
  it('preserves structurally identical objects', () => {
    interface A {
      a: number;
      b: string;
    }
    const value: Compute<A> = { a: 1, b: 'hello' };
    expect(value).toEqual({ a: 1, b: 'hello' });
  });

  it('works on unions by distributing over each member', () => {
    type U = { kind: 'a'; a: number } | { kind: 'b'; b: string };
    const left: Compute<U> = { kind: 'a', a: 1 };
    const right: Compute<U> = { kind: 'b', b: 'x' };
    expect(left.kind).toBe('a');
    expect(right.kind).toBe('b');
  });
});
