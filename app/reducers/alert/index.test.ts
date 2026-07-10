import alertReducer, { AlertState } from './index';
import type { AlertAction } from '../../actions/alert';

const emptyAction = { type: null } as unknown as AlertAction;

describe('alertReducer', () => {
  it('should return initial state', () => {
    const initialState: AlertState = {
      isVisible: false,
      autodismiss: null,
      content: null,
      data: null,
    };
    expect(alertReducer(undefined, emptyAction)).toEqual(initialState);
  });
});
