import React from 'react';

import { Alert, Severity } from './alerts';

describe('alerts types', () => {
  describe('Severity enum', () => {
    it('exposes Danger / Warning / Info severities with expected values', () => {
      expect(Severity.Danger).toBe('danger');
      expect(Severity.Warning).toBe('warning');
      expect(Severity.Info).toBe('info');
    });

    it('exposes exactly the three expected members', () => {
      expect(Object.values(Severity).sort()).toStrictEqual(
        ['danger', 'info', 'warning'].sort(),
      );
    });
  });

  describe('Alert shape', () => {
    it('accepts an alert with a message', () => {
      const alertWithMessage: Alert = {
        key: 'my-alert',
        severity: Severity.Warning,
        title: 'Heads up',
        message: 'Something might be off.',
      };
      expect(alertWithMessage.key).toBe('my-alert');
      expect(alertWithMessage.severity).toBe(Severity.Warning);
    });

    it('accepts an alert with content only (no message)', () => {
      const alertWithContent: Alert = {
        key: 'content-alert',
        severity: Severity.Info,
        title: 'Hello',
        content: React.createElement('div'),
      };
      expect(alertWithContent.title).toBe('Hello');
      expect(alertWithContent.severity).toBe(Severity.Info);
    });
  });
});
