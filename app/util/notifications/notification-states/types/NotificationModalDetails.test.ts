import type {
  ModalFieldAddress,
  ModalFieldTransaction,
  ModalFieldNetwork,
  ModalFieldAsset,
  ModalFieldNFTCollectionImage,
  ModalFieldStakingProvider,
  ModalFieldSwapsRate,
  ModalFieldNetworkFee,
  ModalFieldAnnouncementDescription,
  ModalField,
  ModalHeaderNFTImage,
  ModalHeaderAnnouncementImage,
  ModalHeader,
  ModalFooterBlockExplorer,
  ModalFooterAnnouncementCta,
  ModalFooter,
  NotificationModalDetails,
} from './NotificationModalDetails';
import { ModalFieldType, ModalFooterType, ModalHeaderType } from '../../constants';

describe('NotificationModalDetails types', () => {
  it('creates a valid ModalFieldAddress', () => {
    const field: ModalFieldAddress = {
      type: ModalFieldType.ADDRESS,
      label: 'From',
      address: '0x123',
    };
    expect(field.type).toBe(ModalFieldType.ADDRESS);
    expect(field.label).toBe('From');
    expect(field.address).toBe('0x123');
  });

  it('creates a valid ModalFieldTransaction', () => {
    const field: ModalFieldTransaction = {
      type: ModalFieldType.TRANSACTION,
      txHash: '0xabc',
    };
    expect(field.type).toBe(ModalFieldType.TRANSACTION);
    expect(field.txHash).toBe('0xabc');
  });

  it('creates a valid ModalFieldNetwork', () => {
    const field: ModalFieldNetwork = {
      type: ModalFieldType.NETWORK,
      name: 'Ethereum',
    };
    expect(field.type).toBe(ModalFieldType.NETWORK);
    expect(field.name).toBe('Ethereum');
  });

  it('creates a valid ModalFieldAsset', () => {
    const field: ModalFieldAsset = {
      type: ModalFieldType.ASSET,
      label: 'Asset',
      description: 'USDC',
      amount: '100 USDC',
      usdAmount: '$100.00',
    };
    expect(field.type).toBe(ModalFieldType.ASSET);
    expect(field.amount).toBe('100 USDC');
  });

  it('creates a valid ModalFieldNFTCollectionImage', () => {
    const field: ModalFieldNFTCollectionImage = {
      type: ModalFieldType.NFT_COLLECTION_IMAGE,
      collectionImageUrl: 'https://example.com/nft.png',
      collectionName: 'Pixel Birds (#211)',
    };
    expect(field.type).toBe(ModalFieldType.NFT_COLLECTION_IMAGE);
    expect(field.collectionName).toBe('Pixel Birds (#211)');
  });

  it('creates a valid ModalFieldStakingProvider', () => {
    const field: ModalFieldStakingProvider = {
      type: ModalFieldType.STAKING_PROVIDER,
      tokenIconUrl: 'https://example.com/icon.png',
      stakingProvider: 'Lido',
    };
    expect(field.type).toBe(ModalFieldType.STAKING_PROVIDER);
    expect(field.stakingProvider).toBe('Lido');
  });

  it('creates a valid ModalFieldSwapsRate', () => {
    const field: ModalFieldSwapsRate = {
      type: ModalFieldType.SWAP_RATE,
      rate: '1 ETH = 1800 USDC',
    };
    expect(field.type).toBe(ModalFieldType.SWAP_RATE);
    expect(field.rate).toBe('1 ETH = 1800 USDC');
  });

  it('creates a valid ModalFooterBlockExplorer', () => {
    const footer: ModalFooterBlockExplorer = {
      type: ModalFooterType.BLOCK_EXPLORER,
      chainId: 1,
      txHash: '0xabc',
    };
    expect(footer.type).toBe(ModalFooterType.BLOCK_EXPLORER);
    expect(footer.chainId).toBe(1);
  });

  it('creates a valid ModalFooterAnnouncementCta', () => {
    const footer: ModalFooterAnnouncementCta = {
      type: ModalFooterType.ANNOUNCEMENT_CTA,
    };
    expect(footer.type).toBe(ModalFooterType.ANNOUNCEMENT_CTA);
  });

  it('creates a valid ModalHeaderNFTImage', () => {
    const header: ModalHeaderNFTImage = {
      type: ModalHeaderType.NFT_IMAGE,
      nftImageUrl: 'https://example.com/nft.png',
    };
    expect(header.type).toBe(ModalHeaderType.NFT_IMAGE);
  });

  it('creates a valid ModalHeaderAnnouncementImage', () => {
    const header: ModalHeaderAnnouncementImage = {
      type: ModalHeaderType.ANNOUNCEMENT_IMAGE,
      imageUrl: 'https://example.com/announcement.png',
    };
    expect(header.type).toBe(ModalHeaderType.ANNOUNCEMENT_IMAGE);
  });

  it('creates a valid NotificationModalDetails', () => {
    const details: NotificationModalDetails = {
      title: 'Transaction Complete',
      createdAt: '2024-01-01T00:00:00Z',
      fields: [
        {
          type: ModalFieldType.ADDRESS,
          label: 'From',
          address: '0x123',
        },
      ],
    };
    expect(details.title).toBe('Transaction Complete');
    expect(details.fields).toHaveLength(1);
  });
});
