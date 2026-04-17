import { ETH_ACTIONS, PROTOCOLS, ACTIONS, PREFIXES } from './deeplinks';

describe('deeplinks constants', () => {
  describe('ETH_ACTIONS', () => {
    it('has TRANSFER action', () => {
      expect(ETH_ACTIONS.TRANSFER).toBe('transfer');
    });

    it('has APPROVE action', () => {
      expect(ETH_ACTIONS.APPROVE).toBe('approve');
    });
  });

  describe('PROTOCOLS', () => {
    it('has HTTP protocol', () => {
      expect(PROTOCOLS.HTTP).toBe('http');
    });

    it('has HTTPS protocol', () => {
      expect(PROTOCOLS.HTTPS).toBe('https');
    });

    it('has WC protocol', () => {
      expect(PROTOCOLS.WC).toBe('wc');
    });

    it('has ETHEREUM protocol', () => {
      expect(PROTOCOLS.ETHEREUM).toBe('ethereum');
    });

    it('has DAPP protocol', () => {
      expect(PROTOCOLS.DAPP).toBe('dapp');
    });

    it('has METAMASK protocol', () => {
      expect(PROTOCOLS.METAMASK).toBe('metamask');
    });
  });

  describe('ACTIONS', () => {
    it('has expected actions', () => {
      expect(ACTIONS.DAPP).toBe('dapp');
      expect(ACTIONS.SEND).toBe('send');
      expect(ACTIONS.APPROVE).toBe('approve');
      expect(ACTIONS.PAYMENT).toBe('payment');
      expect(ACTIONS.FOCUS).toBe('focus');
      expect(ACTIONS.WC).toBe('wc');
      expect(ACTIONS.CONNECT).toBe('connect');
      expect(ACTIONS.MMSDK).toBe('mmsdk');
      expect(ACTIONS.ANDROID_SDK).toBe('bind');
      expect(ACTIONS.BUY).toBe('buy');
      expect(ACTIONS.BUY_CRYPTO).toBe('buy-crypto');
      expect(ACTIONS.SELL).toBe('sell');
      expect(ACTIONS.SELL_CRYPTO).toBe('sell-crypto');
      expect(ACTIONS.EMPTY).toBe('');
    });
  });

  describe('PREFIXES', () => {
    it('has correct prefix for DAPP action', () => {
      expect(PREFIXES[ACTIONS.DAPP]).toBe('https://');
    });

    it('has correct prefix for SEND action', () => {
      expect(PREFIXES[ACTIONS.SEND]).toBe('ethereum:');
    });

    it('has correct prefix for APPROVE action', () => {
      expect(PREFIXES[ACTIONS.APPROVE]).toBe('ethereum:');
    });

    it('has METAMASK prefix', () => {
      expect(PREFIXES.METAMASK).toBe('metamask://');
    });

    it('has empty prefix for FOCUS action', () => {
      expect(PREFIXES[ACTIONS.FOCUS]).toBe('');
    });
  });
});
