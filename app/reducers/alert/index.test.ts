import reducer, { initialState } from './index';
import { showAlert, type AlertAction } from '../../actions/alert';

describe('alertReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as AlertAction),
    ).toEqual(initialState);
  });

  it('shows an alert', () => {
    const action = showAlert({
      isVisible: true,
      autodismiss: 1000,
      content: 'content',
      data: null,
    });
    expect(reducer(undefined, action)).toEqual({
      ...initialState,
      isVisible: true,
      autodismiss: 1000,
      content: 'content',
      data: null,
    });
  });
});
