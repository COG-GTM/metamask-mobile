import { typedSign } from './signatureUtils';

describe('signatureUtils', () => {
  describe('typedSign', () => {
    it('V1 is eth_signTypedData', () => {
      expect(typedSign.V1).toBe('eth_signTypedData');
    });

    it('V3 is eth_signTypedData_v3', () => {
      expect(typedSign.V3).toBe('eth_signTypedData_v3');
    });

    it('V4 is eth_signTypedData_v4', () => {
      expect(typedSign.V4).toBe('eth_signTypedData_v4');
    });
  });
});
