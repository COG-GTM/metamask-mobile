import {
  TRIGGER_TYPES } from

'@metamask/notification-services-controller/notification-services';
import { hasNotificationModal, NotificationComponentState } from '.';

describe('hasNotificationModal', () => {
  const mockNotificationComponentState = (
  createModalDetails) =>
  {
    NotificationComponentState[TRIGGER_TYPES.ERC20_SENT] = {
      guardFn: (n) => true,
      createMenuItem: jest.fn(),
      createModalDetails: createModalDetails ? jest.fn() : undefined
    };
  };

  afterEach(() => {
    delete NotificationComponentState[
    TRIGGER_TYPES.ERC20_SENT];

  });

  it('returns false for an invalid trigger type', () => {
    const invalidTriggerType = 'INVALID_TRIGGER';

    const result = hasNotificationModal(invalidTriggerType);

    expect(result).toBe(false);
  });

  it('returns false when createModalDetails is undefined', () => {
    mockNotificationComponentState(undefined);

    const result = hasNotificationModal(TRIGGER_TYPES.ERC20_SENT);

    expect(result).toBe(false);
  });

  it('returns true when createModalDetails is defined', () => {
    mockNotificationComponentState(true);

    const result = hasNotificationModal(TRIGGER_TYPES.ERC20_SENT);

    expect(result).toBe(true);
  });
});