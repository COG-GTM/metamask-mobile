import { ExcludedSnapPermissions, ExcludedSnapEndowments, EndowmentPermissions } from './permissions';

describe('Snaps permissions', () => {
  describe('ExcludedSnapPermissions', () => {
    it('should include eth_accounts', () => {
      expect(ExcludedSnapPermissions).toHaveProperty('eth_accounts');
      expect(typeof ExcludedSnapPermissions.eth_accounts).toBe('string');
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(ExcludedSnapPermissions)).toBe(true);
    });
  });

  describe('ExcludedSnapEndowments', () => {
    it('should be a frozen empty object', () => {
      expect(Object.isFrozen(ExcludedSnapEndowments)).toBe(true);
      expect(Object.keys(ExcludedSnapEndowments)).toHaveLength(0);
    });
  });

  describe('EndowmentPermissions', () => {
    it('should include network-access endowment', () => {
      expect(EndowmentPermissions['endowment:network-access']).toBe('endowment:network-access');
    });

    it('should include transaction-insight endowment', () => {
      expect(EndowmentPermissions['endowment:transaction-insight']).toBe('endowment:transaction-insight');
    });

    it('should include rpc endowment', () => {
      expect(EndowmentPermissions['endowment:rpc']).toBe('endowment:rpc');
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(EndowmentPermissions)).toBe(true);
    });
  });
});
