import alertReducer from './index';

describe('alertReducer', () => {
  it('returns initial state', () => {
    const state = alertReducer(undefined, { type: 'UNKNOWN' } as never);
    expect(state).toEqual({
      isVisible: false,
      autodismiss: null,
      content: null,
      data: null,
    });
  });

  it('handles SHOW_ALERT', () => {
    const state = alertReducer(undefined, {
      type: 'SHOW_ALERT',
      isVisible: true,
      autodismiss: 5000,
      content: 'clipboard-alert',
      data: { msg: 'copied' },
    });
    expect(state).toEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'clipboard-alert',
      data: { msg: 'copied' },
    });
  });

  it('handles HIDE_ALERT', () => {
    const firstState = alertReducer(undefined, {
      type: 'SHOW_ALERT',
      isVisible: true,
      autodismiss: 5000,
      content: 'clipboard-alert',
      data: null,
    });
    const secondState = alertReducer(firstState, { type: 'HIDE_ALERT' });
    expect(secondState.isVisible).toBe(false);
    expect(secondState.autodismiss).toBeNull();
  });
});
