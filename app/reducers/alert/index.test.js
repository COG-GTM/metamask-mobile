import alertReducer from './';

describe('alertReducer', () => {
  const initialState = {
    isVisible: false,
    autodismiss: null,
    content: null,
    data: null,
  };

  it('should return the initial state', () => {
    expect(alertReducer(undefined, { type: 'UNKNOWN' })).toEqual(initialState);
  });

  it('should handle SHOW_ALERT', () => {
    const action = {
      type: 'SHOW_ALERT',
      autodismiss: 5000,
      content: 'Test alert content',
      data: { key: 'value' },
    };
    const result = alertReducer(initialState, action);
    expect(result).toEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert content',
      data: { key: 'value' },
    });
  });

  it('should handle SHOW_ALERT with null autodismiss', () => {
    const action = {
      type: 'SHOW_ALERT',
      autodismiss: null,
      content: 'Alert without autodismiss',
      data: null,
    };
    const result = alertReducer(initialState, action);
    expect(result).toEqual({
      isVisible: true,
      autodismiss: null,
      content: 'Alert without autodismiss',
      data: null,
    });
  });

  it('should handle HIDE_ALERT', () => {
    const visibleState = {
      isVisible: true,
      autodismiss: 5000,
      content: 'Some content',
      data: { key: 'value' },
    };
    const result = alertReducer(visibleState, { type: 'HIDE_ALERT' });
    expect(result).toEqual({
      isVisible: false,
      autodismiss: null,
      content: 'Some content',
      data: { key: 'value' },
    });
  });

  it('should return state unchanged for unknown action type', () => {
    const state = {
      isVisible: true,
      autodismiss: 3000,
      content: 'Existing',
      data: null,
    };
    expect(alertReducer(state, { type: 'NONEXISTENT_ACTION' })).toBe(state);
  });
});
