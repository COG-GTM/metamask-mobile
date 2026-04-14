import alertReducer from '.';

describe('Alert Reducer', () => {
  const initialState = {
    isVisible: false,
    autodismiss: null,
    content: null,
    data: null,
  };

  it('should return initial state', () => {
    expect(alertReducer(undefined, {})).toStrictEqual(initialState);
  });

  it('should handle SHOW_ALERT', () => {
    const result = alertReducer(initialState, {
      type: 'SHOW_ALERT',
      autodismiss: 5000,
      content: 'Alert message',
      data: { key: 'value' },
    });

    expect(result).toStrictEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'Alert message',
      data: { key: 'value' },
    });
  });

  it('should handle HIDE_ALERT', () => {
    const visibleState = { ...initialState, isVisible: true, content: 'msg' };
    const result = alertReducer(visibleState, { type: 'HIDE_ALERT' });

    expect(result.isVisible).toBe(false);
    expect(result.autodismiss).toBeNull();
  });

  it('should return state for unknown action', () => {
    expect(alertReducer(initialState, { type: 'UNKNOWN' })).toStrictEqual(initialState);
  });
});
