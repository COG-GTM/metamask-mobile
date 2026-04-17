import { ModalFieldType, ModalFooterType, ModalHeaderType } from './config';

describe('notification config constants', () => {
  describe('ModalFieldType', () => {
    it('has ASSET type', () => {
      expect(ModalFieldType.ASSET).toBe('ModalField-Asset');
    });

    it('has ADDRESS type', () => {
      expect(ModalFieldType.ADDRESS).toBe('ModalField-Address');
    });

    it('has ANNOUNCEMENT_DESCRIPTION type', () => {
      expect(ModalFieldType.ANNOUNCEMENT_DESCRIPTION).toBe('ModalField-AnnouncementDescription');
    });

    it('has TRANSACTION type', () => {
      expect(ModalFieldType.TRANSACTION).toBe('ModalField-Transaction');
    });

    it('has STAKING_PROVIDER type', () => {
      expect(ModalFieldType.STAKING_PROVIDER).toBe('ModalField-StakingProvider');
    });

    it('has NETWORK_FEE type', () => {
      expect(ModalFieldType.NETWORK_FEE).toBe('ModalField-NetworkFee');
    });

    it('has NETWORK type', () => {
      expect(ModalFieldType.NETWORK).toBe('ModalField-Network');
    });

    it('has NFT_IMAGE type', () => {
      expect(ModalFieldType.NFT_IMAGE).toBe('ModalField-NFTImage');
    });

    it('has NFT_COLLECTION_IMAGE type', () => {
      expect(ModalFieldType.NFT_COLLECTION_IMAGE).toBe('ModalField-NFTCollectionImage');
    });

    it('has SWAP_RATE type', () => {
      expect(ModalFieldType.SWAP_RATE).toBe('ModalField-SwapsRate');
    });
  });

  describe('ModalFooterType', () => {
    it('has BLOCK_EXPLORER type', () => {
      expect(ModalFooterType.BLOCK_EXPLORER).toBe('ModalFooter-BlockExplorer');
    });

    it('has ANNOUNCEMENT_CTA type', () => {
      expect(ModalFooterType.ANNOUNCEMENT_CTA).toBe('ModalFooter-AnnouncementCta');
    });
  });

  describe('ModalHeaderType', () => {
    it('has NFT_IMAGE type', () => {
      expect(ModalHeaderType.NFT_IMAGE).toBe('ModalHeader-NFTImage');
    });

    it('has ANNOUNCEMENT_IMAGE type', () => {
      expect(ModalHeaderType.ANNOUNCEMENT_IMAGE).toBe('ModalHeader-AnnouncementImage');
    });
  });
});
