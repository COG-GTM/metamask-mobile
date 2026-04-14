import { dismissAlert, showAlert } from '.';

describe('Alert Actions', () => {
  describe('dismissAlert', () => {
    it('should return HIDE_ALERT action', () => {
      expect(dismissAlert()).toStrictEqual({ type: 'HIDE_ALERT' });
    });
  });

  describe('showAlert', () => {
    it('should return SHOW_ALERT action with all fields', () => {
      const payload = {
        isVisible: true,
        autodismiss: 5000,
        content: 'Test alert',
        data: { key: 'value' },
      };

      expect(showAlert(payload)).toStrictEqual({
        type: 'SHOW_ALERT',
        isVisible: true,
        autodismiss: 5000,
        content: 'Test alert',
        data: { key: 'value' },
      });
    });

    it('should handle undefined fields', () => {
      const result = showAlert({});

      expect(result.type).toBe('SHOW_ALERT');
      expect(result.isVisible).toBeUndefined();
    });
  });
});
