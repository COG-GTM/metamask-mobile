import alertReducer from './index';
import { showAlert, dismissAlert } from '../../actions/alert';

describe('alertReducer', () => {
  const initialState = alertReducer(undefined, { type: 'UNKNOWN' });

  it('returns the initial state', () => {
    expect(initialState).toEqual({
      isVisible: false,
      autodismiss: null,
      content: null,
      data: null,
    });
  });

  it('shows an alert', () => {
    const state = alertReducer(
      initialState,
      showAlert({
        isVisible: true,
        autodismiss: 1500,
        content: 'clipboard-alert',
        data: { msg: 'Copied' },
      }),
    );
    expect(state).toEqual({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: 'Copied' },
    });
  });

  it('hides an alert while keeping content', () => {
    const shown = alertReducer(
      initialState,
      showAlert({ isVisible: true, autodismiss: 1, content: 'c', data: 'd' }),
    );
    const state = alertReducer(shown, dismissAlert());
    expect(state).toEqual({
      isVisible: false,
      autodismiss: null,
      content: 'c',
      data: 'd',
    });
  });

  it('creates actions', () => {
    expect(dismissAlert()).toEqual({ type: 'HIDE_ALERT' });
    expect(
      showAlert({ isVisible: true, autodismiss: 1, content: 'c', data: 'd' }),
    ).toEqual({
      type: 'SHOW_ALERT',
      isVisible: true,
      autodismiss: 1,
      content: 'c',
      data: 'd',
    });
  });
});
