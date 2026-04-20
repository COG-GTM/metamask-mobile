import { Caveat, ValidPermission } from '@metamask/permission-controller';
import { Json } from '@metamask/utils';
import extractApprovedAccounts, {
  extractApprovedAccounts as namedExtractApprovedAccounts,
} from './extractApprovedAccounts';

type TestPermission =
  | ValidPermission<string, Caveat<string, Json>>
  | ValidPermission<string, Caveat<string, string[]>>
  | undefined;

const buildPermission = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caveats: Caveat<any, any>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ValidPermission<string, Caveat<string, any>> =>
  ({
    id: 'id',
    parentCapability: 'eth_accounts',
    invoker: 'https://dapp.example',
    date: 0,
    caveats,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as ValidPermission<string, Caveat<string, any>>);

describe('extractApprovedAccounts', () => {
  it('returns a flattened array of approved accounts from array caveats', () => {
    const permission = buildPermission([
      { type: 'restrictReturnedAccounts', value: ['0x1', '0x2'] },
      { type: 'restrictReturnedAccounts', value: ['0x3'] },
    ]);

    expect(extractApprovedAccounts(permission)).toEqual(['0x1', '0x2', '0x3']);
  });

  it('drops caveats whose value is not an array', () => {
    const permission = buildPermission([
      { type: 'foo', value: 'not-an-array' },
      { type: 'restrictReturnedAccounts', value: ['0xabc'] },
    ]);

    expect(extractApprovedAccounts(permission)).toEqual([undefined, '0xabc']);
  });

  it('returns undefined when the permission is undefined', () => {
    expect(extractApprovedAccounts(undefined as TestPermission)).toBeUndefined();
  });

  it('returns undefined when the permission has no caveats', () => {
    const permission = {
      id: 'id',
      parentCapability: 'eth_accounts',
      invoker: 'https://dapp.example',
      date: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as ValidPermission<string, Caveat<string, any>>;

    expect(extractApprovedAccounts(permission)).toBeUndefined();
  });

  it('returns an empty array when caveats are empty', () => {
    const permission = buildPermission([]);
    expect(extractApprovedAccounts(permission)).toEqual([]);
  });

  it('exports the same function as default and named export', () => {
    expect(namedExtractApprovedAccounts).toBe(extractApprovedAccounts);
  });
});
