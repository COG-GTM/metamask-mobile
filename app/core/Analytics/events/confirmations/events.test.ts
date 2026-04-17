import { CONFIRMATION_EVENTS, TRANSACTION_EVENTS } from './events';

describe('confirmation events', () => {
  describe('CONFIRMATION_EVENTS', () => {
    it('has ADVANCED_DETAILS_CLICKED event', () => {
      expect(CONFIRMATION_EVENTS.ADVANCED_DETAILS_CLICKED).toBeDefined();
    });

    it('has BLOCKAID_ALERT_LINK_CLICKED event', () => {
      expect(CONFIRMATION_EVENTS.BLOCKAID_ALERT_LINK_CLICKED).toBeDefined();
    });

    it('has SCREEN_VIEWED event', () => {
      expect(CONFIRMATION_EVENTS.SCREEN_VIEWED).toBeDefined();
    });

    it('has TOOLTIP_CLICKED event', () => {
      expect(CONFIRMATION_EVENTS.TOOLTIP_CLICKED).toBeDefined();
    });
  });

  describe('TRANSACTION_EVENTS', () => {
    it('has TRANSACTION_ADDED event', () => {
      expect(TRANSACTION_EVENTS.TRANSACTION_ADDED).toBeDefined();
    });

    it('has TRANSACTION_APPROVED event', () => {
      expect(TRANSACTION_EVENTS.TRANSACTION_APPROVED).toBeDefined();
    });

    it('has TRANSACTION_FINALIZED event', () => {
      expect(TRANSACTION_EVENTS.TRANSACTION_FINALIZED).toBeDefined();
    });

    it('has TRANSACTION_REJECTED event', () => {
      expect(TRANSACTION_EVENTS.TRANSACTION_REJECTED).toBeDefined();
    });

    it('has TRANSACTION_SUBMITTED event', () => {
      expect(TRANSACTION_EVENTS.TRANSACTION_SUBMITTED).toBeDefined();
    });
  });
});
