import reducer, { initialState } from './index';
import type { Action } from '../../actions/alert';

describe('alert reducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(reducer(undefined, { type: '@@INIT' } as unknown as Action)).toEqual(
      initialState,
    );
  });
});
