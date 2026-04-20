import ExtendedKeyringTypes, { HardwareDeviceTypes } from './keyringTypes';

describe('keyringTypes constants', () => {
  describe('ExtendedKeyringTypes', () => {
    it('defines simple key pair type', () => {
      expect(ExtendedKeyringTypes.simple).toBe('Simple Key Pair');
    });

    it('defines HD key tree type', () => {
      expect(ExtendedKeyringTypes.hd).toBe('HD Key Tree');
    });

    it('defines QR hardware wallet type', () => {
      expect(ExtendedKeyringTypes.qr).toBe('QR Hardware Wallet Device');
    });

    it('defines Ledger hardware type', () => {
      expect(ExtendedKeyringTypes.ledger).toBe('Ledger Hardware');
    });
  });

  describe('HardwareDeviceTypes', () => {
    it('defines LEDGER', () => {
      expect(HardwareDeviceTypes.LEDGER).toBe('Ledger');
    });

    it('defines QR', () => {
      expect(HardwareDeviceTypes.QR).toBe('QR Hardware');
    });
  });
});
