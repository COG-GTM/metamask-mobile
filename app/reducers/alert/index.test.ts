import alertReducer, { initialState } from '.';
import { showAlert, dismissAlert } from '../../actions/alert';

describe('alertReducer', () => {
  it('returns the initial state by default', () => {
    expect(alertReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual(
      initialState,
    );
  });

  it('handles SHOW_ALERT', () => {
    const action = showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: 'copied' },
    });

    expect(alertReducer(initialState, action)).toEqual({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: 'copied' },
    });
  });

  it('handles HIDE_ALERT', () => {
    const visibleState = {
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: 'copied' },
    };

    expect(alertReducer(visibleState, dismissAlert())).toEqual({
      ...visibleState,
      isVisible: false,
      autodismiss: null,
    });
  });
});
