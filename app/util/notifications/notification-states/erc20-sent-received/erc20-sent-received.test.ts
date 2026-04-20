/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationERC20Received,
  createMockNotificationERC20Sent,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './erc20-sent-received';

describe('erc20-sent-received notification state', () => {
  it('guardFn accepts ERC20 sent/received and rejects others', () => {
    expect(state.guardFn(createMockNotificationERC20Sent() as any)).toBe(true);
    expect(state.guardFn(createMockNotificationERC20Received() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem exposes a title, a start/end description, and an image', () => {
    const menu = state.createMenuItem(
      createMockNotificationERC20Sent() as any,
    );
    expect(menu.title).toEqual(expect.any(String));
    expect(menu.description.start).toEqual(expect.any(String));
    expect(menu.description.end).toEqual(expect.stringContaining(''));
    expect(menu.image).toEqual(
      expect.objectContaining({ url: expect.anything() }),
    );
  });

  it('createModalDetails returns fields and a block-explorer footer', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationERC20Received() as any,
    );
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ADDRESS,
      ModalFieldType.TRANSACTION,
      ModalFieldType.ASSET,
      ModalFieldType.NETWORK,
    ]);
  });
});
