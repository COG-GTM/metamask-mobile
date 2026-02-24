import alertReducer from './';

const initialState = {
  isVisible: false,
  autodismiss: null,
  content: null,
  data: null,
};

describe('alertReducer', () => {
  it('returns initial state', () => {
    const state = alertReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles SHOW_ALERT', () => {
    const state = alertReducer(initialState, {
      type: 'SHOW_ALERT',
      autodismiss: 5000,
      content: 'Test alert',
      data: { key: 'value' },
    });
    expect(state).toEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { key: 'value' },
    });
  });

  it('handles HIDE_ALERT', () => {
    const visibleState = {
      isVisible: true,
      autodismiss: 5000,
      content: 'Test',
      data: null,
    };
    const state = alertReducer(visibleState, { type: 'HIDE_ALERT' });
    expect(state.isVisible).toBe(false);
    expect(state.autodismiss).toBeNull();
  });

  it('returns current state for unknown action', () => {
    const state = alertReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });
});
