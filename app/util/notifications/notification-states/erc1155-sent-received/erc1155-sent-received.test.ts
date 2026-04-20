/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationERC1155Received,
  createMockNotificationERC1155Sent,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import {
  ModalFieldType,
  ModalFooterType,
  ModalHeaderType,
} from '../../constants';
import state from './erc1155-sent-received';

describe('erc1155-sent-received notification state', () => {
  it('guardFn accepts ERC1155 sent/received and rejects others', () => {
    expect(state.guardFn(createMockNotificationERC1155Sent() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationERC1155Received() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem returns a menu item with image variant=square', () => {
    const menu = state.createMenuItem(
      createMockNotificationERC1155Sent() as any,
    );
    expect(menu.image?.variant).toBe('square');
    expect(menu.title).toEqual(expect.any(String));
  });

  it('createModalDetails includes the NFT image header and block-explorer footer', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationERC1155Received() as any,
    );
    expect(details.header).toEqual(
      expect.objectContaining({ type: ModalHeaderType.NFT_IMAGE }),
    );
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual(
      expect.arrayContaining([
        ModalFieldType.ADDRESS,
        ModalFieldType.TRANSACTION,
        ModalFieldType.NETWORK,
      ]),
    );
  });
});
