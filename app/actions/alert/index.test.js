import { dismissAlert, showAlert } from './';

describe('Alert Actions', () => {
  describe('dismissAlert', () => {
    it('returns HIDE_ALERT action', () => {
      expect(dismissAlert()).toEqual({ type: 'HIDE_ALERT' });
    });
  });

  describe('showAlert', () => {
    it('returns SHOW_ALERT action with all fields', () => {
      const result = showAlert({
        isVisible: true,
        autodismiss: 5000,
        content: 'Alert content',
        data: { key: 'value' },
      });
      expect(result).toEqual({
        type: 'SHOW_ALERT',
        isVisible: true,
        autodismiss: 5000,
        content: 'Alert content',
        data: { key: 'value' },
      });
    });

    it('returns SHOW_ALERT action with partial fields', () => {
      const result = showAlert({
        isVisible: true,
        autodismiss: undefined,
        content: undefined,
        data: undefined,
      });
      expect(result).toEqual({
        type: 'SHOW_ALERT',
        isVisible: true,
        autodismiss: undefined,
        content: undefined,
        data: undefined,
      });
    });
  });
});
