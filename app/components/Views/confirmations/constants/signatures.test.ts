import {
  PRIMARY_TYPES,
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
  PrimaryType,
  PrimaryTypeOrder,
  PrimaryTypePermit,
  ResultType,
} from './signatures';

describe('signatures constants', () => {
  describe('PrimaryTypeOrder', () => {
    it('contains expected order primary types', () => {
      expect(PrimaryTypeOrder.Order).toBe('Order');
      expect(PrimaryTypeOrder.OrderComponents).toBe('OrderComponents');
    });
  });

  describe('PrimaryTypePermit', () => {
    it('contains expected permit primary types', () => {
      expect(PrimaryTypePermit.Permit).toBe('Permit');
      expect(PrimaryTypePermit.PermitBatch).toBe('PermitBatch');
      expect(PrimaryTypePermit.PermitBatchTransferFrom).toBe(
        'PermitBatchTransferFrom',
      );
      expect(PrimaryTypePermit.PermitSingle).toBe('PermitSingle');
      expect(PrimaryTypePermit.PermitTransferFrom).toBe('PermitTransferFrom');
    });
  });

  describe('PrimaryType (union const)', () => {
    it('merges order and permit types', () => {
      expect(PrimaryType.Order).toBe('Order');
      expect(PrimaryType.Permit).toBe('Permit');
      expect(PrimaryType.PermitBatch).toBe('PermitBatch');
    });
  });

  describe('type arrays', () => {
    it('exposes the order primary type list', () => {
      expect(PRIMARY_TYPES_ORDER).toStrictEqual(
        Object.values(PrimaryTypeOrder),
      );
    });

    it('exposes the permit primary type list', () => {
      expect(PRIMARY_TYPES_PERMIT).toStrictEqual(
        Object.values(PrimaryTypePermit),
      );
    });

    it('exposes the combined primary type list', () => {
      expect(PRIMARY_TYPES).toEqual(
        expect.arrayContaining([
          ...PRIMARY_TYPES_ORDER,
          ...PRIMARY_TYPES_PERMIT,
        ]),
      );
      expect(PRIMARY_TYPES).toHaveLength(
        PRIMARY_TYPES_ORDER.length + PRIMARY_TYPES_PERMIT.length,
      );
    });
  });

  describe('ResultType', () => {
    it('contains the expected blockaid result types', () => {
      expect(ResultType.Benign).toBe('Benign');
      expect(ResultType.Malicious).toBe('Malicious');
      expect(ResultType.Warning).toBe('Warning');
      expect(ResultType.Failed).toBe('Failed');
      expect(ResultType.RequestInProgress).toBe('RequestInProgress');
    });
  });
});
