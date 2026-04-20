import {
  ModalFieldType,
  ModalFooterType,
  ModalHeaderType,
} from '../../constants';
import type {
  ModalField,
  ModalFieldAddress,
  ModalFieldAsset,
  ModalFieldNetworkFee,
  ModalFooter,
  ModalHeader,
  NotificationModalDetails,
} from './NotificationModalDetails';

describe('NotificationModalDetails types', () => {
  it('ModalField union members discriminate on type', () => {
    const address: ModalFieldAddress = {
      type: ModalFieldType.ADDRESS,
      label: 'From',
      address: '0x1',
    };
    const asset: ModalFieldAsset = {
      type: ModalFieldType.ASSET,
      label: 'Asset',
      description: 'ETH',
      amount: '1 ETH',
      usdAmount: '$1',
    };
    const networkFee: ModalFieldNetworkFee = {
      type: ModalFieldType.NETWORK_FEE,
      getNetworkFees: () => Promise.reject(new Error('not implemented')),
    };

    const fields: ModalField[] = [address, asset, networkFee];
    const types = fields.map((f) => f.type);
    expect(types).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ASSET,
      ModalFieldType.NETWORK_FEE,
    ]);
  });

  it('NotificationModalDetails can be constructed with optional header/footer', () => {
    const header: ModalHeader = {
      type: ModalHeaderType.ANNOUNCEMENT_IMAGE,
      imageUrl: 'https://a.io/i.png',
    };
    const footer: ModalFooter = {
      type: ModalFooterType.BLOCK_EXPLORER,
      chainId: 1,
      txHash: '0xabc',
    };
    const details: NotificationModalDetails = {
      title: 'Title',
      createdAt: '2024-01-01',
      header,
      fields: [],
      footer,
    };

    expect(details.header?.type).toBe(ModalHeaderType.ANNOUNCEMENT_IMAGE);
    expect(details.footer?.type).toBe(ModalFooterType.BLOCK_EXPLORER);
  });
});
