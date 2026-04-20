import { USER_INTENT } from './permissions';

describe('permissions constants', () => {
  describe('USER_INTENT', () => {
    it('defines None', () => {
      expect(USER_INTENT.None).toBeDefined();
    });

    it('defines Create', () => {
      expect(USER_INTENT.Create).toBeDefined();
    });

    it('defines CreateMultiple', () => {
      expect(USER_INTENT.CreateMultiple).toBeDefined();
    });

    it('defines EditMultiple', () => {
      expect(USER_INTENT.EditMultiple).toBeDefined();
    });

    it('defines Confirm', () => {
      expect(USER_INTENT.Confirm).toBeDefined();
    });

    it('defines Cancel', () => {
      expect(USER_INTENT.Cancel).toBeDefined();
    });

    it('defines Import', () => {
      expect(USER_INTENT.Import).toBeDefined();
    });

    it('defines ConnectHW', () => {
      expect(USER_INTENT.ConnectHW).toBeDefined();
    });
  });
});
