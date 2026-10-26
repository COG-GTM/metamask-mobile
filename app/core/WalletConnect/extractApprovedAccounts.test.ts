import { extractApprovedAccounts } from './extractApprovedAccounts';

type Permission = Parameters<typeof extractApprovedAccounts>[0];

describe('extractApprovedAccounts', () => {
  it('returns undefined when there is no permission', () => {
    expect(extractApprovedAccounts(undefined)).toBeUndefined();
  });

  it('flattens array caveat values', () => {
    const permission = {
      caveats: [
        { type: 'restrictReturnedAccounts', value: ['0x1', '0x2'] },
        { type: 'other', value: ['0x3'] },
      ],
    } as unknown as Permission;
    expect(extractApprovedAccounts(permission)).toEqual(['0x1', '0x2', '0x3']);
  });

  it('maps non array caveat values to undefined', () => {
    const permission = {
      caveats: [{ type: 'other', value: { foo: 'bar' } }],
    } as unknown as Permission;
    expect(extractApprovedAccounts(permission)).toEqual([undefined]);
  });
});
