/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationERC721Received,
  createMockNotificationERC721Sent,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import {
  ModalFieldType,
  ModalFooterType,
  ModalHeaderType,
} from '../../constants';
import state from './erc721-sent-received';

describe('erc721-sent-received notification state', () => {
  it('guardFn accepts ERC721 sent/received and rejects others', () => {
    expect(state.guardFn(createMockNotificationERC721Sent() as any)).toBe(true);
    expect(state.guardFn(createMockNotificationERC721Received() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem shows collection name and token id', () => {
    const menu = state.createMenuItem(
      createMockNotificationERC721Sent() as any,
    );
    expect(menu.description.start).toEqual(expect.any(String));
    expect(menu.description.end).toMatch(/^#/);
    expect(menu.image?.variant).toBe('square');
  });

  it('createModalDetails exposes an NFT image header and block-explorer footer', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationERC721Received() as any,
    );
    expect(details.header).toEqual(
      expect.objectContaining({ type: ModalHeaderType.NFT_IMAGE }),
    );
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ADDRESS,
      ModalFieldType.TRANSACTION,
      ModalFieldType.NFT_COLLECTION_IMAGE,
      ModalFieldType.NETWORK,
    ]);
  });
});
