import { ETH_ACTIONS, PROTOCOLS, ACTIONS, PREFIXES } from './deeplinks';

describe('deeplinks constants', () => {
  describe('ETH_ACTIONS', () => {
    it('defines TRANSFER and APPROVE', () => {
      expect(ETH_ACTIONS.TRANSFER).toBe('transfer');
      expect(ETH_ACTIONS.APPROVE).toBe('approve');
    });
  });

  describe('PROTOCOLS', () => {
    it('defines all expected protocols', () => {
      expect(PROTOCOLS.HTTP).toBe('http');
      expect(PROTOCOLS.HTTPS).toBe('https');
      expect(PROTOCOLS.WC).toBe('wc');
      expect(PROTOCOLS.ETHEREUM).toBe('ethereum');
      expect(PROTOCOLS.DAPP).toBe('dapp');
      expect(PROTOCOLS.METAMASK).toBe('metamask');
    });
  });

  describe('ACTIONS', () => {
    it('defines all expected actions', () => {
      expect(ACTIONS.DAPP).toBe('dapp');
      expect(ACTIONS.SEND).toBe('send');
      expect(ACTIONS.APPROVE).toBe('approve');
      expect(ACTIONS.PAYMENT).toBe('payment');
      expect(ACTIONS.FOCUS).toBe('focus');
      expect(ACTIONS.WC).toBe('wc');
      expect(ACTIONS.CONNECT).toBe('connect');
      expect(ACTIONS.MMSDK).toBe('mmsdk');
      expect(ACTIONS.BUY).toBe('buy');
      expect(ACTIONS.SELL).toBe('sell');
      expect(ACTIONS.EMPTY).toBe('');
    });
  });

  describe('PREFIXES', () => {
    it('maps DAPP to https://', () => {
      expect(PREFIXES[ACTIONS.DAPP]).toBe('https://');
    });

    it('maps SEND to ethereum:', () => {
      expect(PREFIXES[ACTIONS.SEND]).toBe('ethereum:');
    });

    it('has a METAMASK prefix', () => {
      expect(PREFIXES.METAMASK).toBe('metamask://');
    });
  });
});
