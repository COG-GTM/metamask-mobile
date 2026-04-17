import { isProtocolAllowed, keyringSnapPermissionsBuilder } from './keyringSnapsPermissions';

describe('keyringSnapsPermissions', () => {
  describe('isProtocolAllowed', () => {
    it('allows https protocol', () => {
      expect(isProtocolAllowed('https://example.com')).toBe(true);
    });

    it('rejects http protocol', () => {
      expect(isProtocolAllowed('http://example.com')).toBe(false);
    });

    it('returns false for invalid URL', () => {
      expect(isProtocolAllowed('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isProtocolAllowed('')).toBe(false);
    });
  });

  describe('keyringSnapPermissionsBuilder', () => {
    it('returns metamask methods for metamask origin', () => {
      const getMethods = keyringSnapPermissionsBuilder('metamask');
      const methods = getMethods();
      expect(methods.length).toBeGreaterThan(0);
      expect(methods).toContain('keyring_listAccounts');
      expect(methods).toContain('keyring_getAccount');
      expect(methods).toContain('keyring_submitRequest');
    });

    it('returns portfolio methods for portfolio origin', () => {
      const getMethods = keyringSnapPermissionsBuilder('https://portfolio.metamask.io');
      const methods = getMethods();
      expect(methods.length).toBeGreaterThan(0);
      expect(methods).toContain('keyring_listAccounts');
    });

    it('returns website methods for https origin', () => {
      const getMethods = keyringSnapPermissionsBuilder('https://example.com');
      const methods = getMethods();
      expect(methods.length).toBeGreaterThan(0);
      expect(methods).toContain('keyring_listAccounts');
      expect(methods).not.toContain('keyring_submitRequest');
    });

    it('returns empty array for non-https origin', () => {
      const getMethods = keyringSnapPermissionsBuilder('http://example.com');
      const methods = getMethods();
      expect(methods).toEqual([]);
    });
  });
});
