import { extractApprovedAccounts } from './extractApprovedAccounts';

describe('extractApprovedAccounts', () => {
  it('should extract accounts from caveats', () => {
    const permission = {
      caveats: [
        { type: 'restrictReturnedAccounts', value: ['0x123', '0x456'] },
      ],
    } as any;

    const result = extractApprovedAccounts(permission);
    expect(result).toEqual(['0x123', '0x456']);
  });

  it('should return undefined for undefined permission', () => {
    const result = extractApprovedAccounts(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle empty caveats', () => {
    const permission = { caveats: [] } as any;
    const result = extractApprovedAccounts(permission);
    expect(result).toEqual([]);
  });

  it('should handle caveats with non-array values', () => {
    const permission = {
      caveats: [{ type: 'test', value: 'not-array' }],
    } as any;
    const result = extractApprovedAccounts(permission);
    expect(result).toEqual([undefined]);
  });
});
