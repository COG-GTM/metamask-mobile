import alertReducer, { initialState, AlertState } from './index';

describe('alertReducer', () => {
  it('returns initial state', () => {
    expect(
      alertReducer(undefined, { type: 'UNKNOWN' } as never),
    ).toEqual(initialState);
  });

  it('handles SHOW_ALERT', () => {
    const action = {
      type: 'SHOW_ALERT' as const,
      autodismiss: 5000,
      content: 'Test alert',
      data: { key: 'value' },
    };

    const result = alertReducer(initialState as AlertState, action);

    expect(result).toEqual({
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { key: 'value' },
    });
  });

  it('handles HIDE_ALERT', () => {
    const visibleState: AlertState = {
      isVisible: true,
      autodismiss: 5000,
      content: 'Test alert',
      data: { key: 'value' },
    };

    const action = { type: 'HIDE_ALERT' as const };

    const result = alertReducer(visibleState, action);

    expect(result).toEqual({
      ...visibleState,
      isVisible: false,
      autodismiss: null,
    });
  });
});
