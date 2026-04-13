import alertReducer, { initialState, AlertState } from './index';
import {
  SHOW_ALERT,
  HIDE_ALERT,
  AlertActionTypes,
} from '../../actions/alert';

describe('alertReducer', () => {
  it('returns initial state', () => {
    expect(
      alertReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual(initialState);
  });

  it('handles SHOW_ALERT', () => {
    const action: AlertActionTypes = {
      type: SHOW_ALERT,
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { msg: 'value' },
    };

    const result = alertReducer(initialState as AlertState, action);

    expect(result).toEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { msg: 'value' },
    });
  });

  it('handles HIDE_ALERT', () => {
    const visibleState: AlertState = {
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { msg: 'value' },
    };

    const action: AlertActionTypes = { type: HIDE_ALERT };

    const result = alertReducer(visibleState, action);

    expect(result).toEqual({
      ...visibleState,
      isVisible: false,
      autodismiss: null,
    });
  });
});
