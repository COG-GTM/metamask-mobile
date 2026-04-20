/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationEthReceived,
  createMockNotificationEthSent,
  createMockNotificationERC20Sent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './eth-sent-received';

describe('eth-sent-received notification state', () => {
  it('guardFn accepts ETH_SENT / ETH_RECEIVED and rejects other types', () => {
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(true);
    expect(state.guardFn(createMockNotificationEthReceived() as any)).toBe(true);
    expect(state.guardFn(createMockNotificationERC20Sent())).toBe(false);
  });

  it('createMenuItem contains a title, description and createdAt', () => {
    const menu = state.createMenuItem(createMockNotificationEthSent() as any);
    expect(menu.title).toEqual(expect.any(String));
    expect(menu.description).toEqual(
      expect.objectContaining({ start: expect.any(String) }),
    );
    expect(menu.createdAt).toEqual(expect.any(String));
    expect(menu.badgeIcon).toBeTruthy();
  });

  it('createModalDetails uses title_sent when the notification is sent', () => {
    const details = (state.createModalDetails as any)(createMockNotificationEthSent() as any);
    expect(details.footer).toEqual({
      type: ModalFooterType.BLOCK_EXPLORER,
      chainId: expect.any(Number),
      txHash: expect.any(String),
    });
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ADDRESS,
      ModalFieldType.TRANSACTION,
      ModalFieldType.ASSET,
      ModalFieldType.NETWORK,
    ]);
  });

  it('createModalDetails uses title_received when the notification is received', () => {
    const n = createMockNotificationEthReceived() as any;
    expect(n.type).toBe(TRIGGER_TYPES.ETH_RECEIVED);
    const details = (state.createModalDetails as any)(n);
    expect(details.fields).toHaveLength(5);
  });
});
