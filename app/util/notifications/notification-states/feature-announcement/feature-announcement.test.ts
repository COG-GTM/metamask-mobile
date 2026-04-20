/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockFeatureAnnouncementRaw,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalHeaderType } from '../../constants';
import state from './feature-announcement';

describe('feature-announcement notification state', () => {
  it('guardFn accepts FEATURES_ANNOUNCEMENT only', () => {
    expect(state.guardFn(createMockFeatureAnnouncementRaw() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem surfaces title + short description from notification.data', () => {
    const n = createMockFeatureAnnouncementRaw() as any;
    const menu = state.createMenuItem(n);
    expect(menu.title).toBe(n.data.title);
    expect(menu.description.start).toBe(n.data.shortDescription);
  });

  it('createModalDetails wraps the announcement image and description', () => {
    const details = (state.createModalDetails as any)(
      createMockFeatureAnnouncementRaw() as any,
    );
    expect(details.header).toEqual(
      expect.objectContaining({ type: ModalHeaderType.ANNOUNCEMENT_IMAGE }),
    );
    expect(details.fields).toHaveLength(1);
    expect(details.fields[0].type).toBe(
      ModalFieldType.ANNOUNCEMENT_DESCRIPTION,
    );
  });
});
