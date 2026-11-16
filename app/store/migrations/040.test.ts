import migration from './040';
import { cloneDeep, merge } from 'lodash';
import initialRootState from '../../util/test/initial-root-state';
import { captureException } from '@sentry/react-native';

const oldState = {
  engine: {
    backgroundState: {
      PermissionController: {
        subjects: {
          'app.uniswap.org': {
            origin: 'app.uniswap.org',
            permissions: {
              eth_accounts: {
                id: 'ukrFhz7_z1gbog3mWNIoA',
                parentCapability: 'eth_accounts',
                invoker: 'app.uniswap.org',
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: [
                      {
                        address: '0x04B09A749Bc6a1C111de308694Ba1Cd74A698523',
                        lastUsed: 1714709418122,
                      },
                    ],
                  },
                ],
                date: 1714709418138,
              },
            },
          },
        },
      },
    },
  },
};

const expectedNewState = {
  engine: {
    backgroundState: {
      PermissionController: {
        subjects: {
          'app.uniswap.org': {
            origin: 'app.uniswap.org',
            permissions: {
              eth_accounts: {
                id: 'ukrFhz7_z1gbog3mWNIoA',
                parentCapability: 'eth_accounts',
                invoker: 'app.uniswap.org',
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x04B09A749Bc6a1C111de308694Ba1Cd74A698523'],
                  },
                ],
                date: 1714709418138,
              },
            },
          },
        },
      },
    },
  },
};

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #40', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const invalidStates = [
    {
      state: merge({}, initialRootState, {
        engine: null,
      }),
      errorMessage:
        "FATAL ERROR: Migration 40: Invalid engine state error: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: null,
        },
      }),
      errorMessage:
        "FATAL ERROR: Migration 40: Invalid engine backgroundState error: 'object'",
      scenario: 'backgroundState is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            PermissionController: null,
          },
        },
      }),
      errorMessage:
        "Migration 40: Invalid PermissionController state error: 'null'",
      scenario: 'PermissionController state is invalid',
    },
  ];

  for (const { errorMessage, scenario, state } of invalidStates) {
    it(`should capture exception if ${scenario}`, async () => {
      const newState = await migration(state);

      expect(newState).toStrictEqual(state);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('should update caveat values to resemble an array of addresses', async () => {
    const newState = await migration(oldState);
    expect(newState).toStrictEqual(expectedNewState);
  });

  const buildState = (PermissionController: unknown) => ({
    engine: { backgroundState: { PermissionController } },
  });
  const ADDRESS_1 = '0x04B09A749Bc6a1C111de308694Ba1Cd74A698523';
  const ADDRESS_2 = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  const ADDRESS_3 = '0x9E66E0aBB12A44Ce88D85dE8bA5c2e2D6E31B7c6';

  it.each([
    ['subjects is missing', {}],
    ['subjects is not an object', { subjects: 'invalid' }],
    ['subjects is null', { subjects: null }],
  ])(
    'should leave PermissionController unchanged if %s',
    async (_scenario, PermissionController) => {
      const state = buildState(PermissionController);
      const expected = cloneDeep(state);

      const newState = await migration(state);

      expect(newState).toStrictEqual(expected);
      expect(mockedCaptureException).not.toHaveBeenCalled();
    },
  );

  it('should leave subjects without permissions or eth_accounts unchanged', async () => {
    const state = buildState({
      subjects: {
        'no-permissions.example': { origin: 'no-permissions.example' },
        'null-subject.example': null,
        'invalid-permissions.example': {
          origin: 'invalid-permissions.example',
          permissions: 'invalid',
        },
        'snap-only.example': {
          origin: 'snap-only.example',
          permissions: {
            'endowment:network-access': {
              id: 'endowment-id',
              parentCapability: 'endowment:network-access',
              invoker: 'snap-only.example',
              caveats: [
                { type: 'someCaveat', value: [{ address: ADDRESS_1 }] },
              ],
              date: 1714709418138,
            },
          },
        },
        'no-caveats.example': {
          origin: 'no-caveats.example',
          permissions: {
            eth_accounts: {
              id: 'no-caveats-id',
              parentCapability: 'eth_accounts',
              invoker: 'no-caveats.example',
              caveats: null,
              date: 1714709418138,
            },
          },
        },
      },
    });
    const expected = cloneDeep(state);

    const newState = await migration(state);

    expect(newState).toStrictEqual(expected);
  });

  it('should only transform eth_accounts and leave other permissions untouched', async () => {
    const otherPermission = {
      id: 'other-id',
      parentCapability: 'endowment:permitted-chains',
      invoker: 'app.uniswap.org',
      caveats: [{ type: 'restrictNetworkSwitching', value: ['0x1'] }],
      date: 1714709418138,
    };
    const state = buildState({
      subjects: {
        'app.uniswap.org': {
          origin: 'app.uniswap.org',
          permissions: {
            eth_accounts: {
              id: 'eth-accounts-id',
              parentCapability: 'eth_accounts',
              invoker: 'app.uniswap.org',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [{ address: ADDRESS_1, lastUsed: 1 }],
                },
              ],
              date: 1714709418138,
            },
            'endowment:permitted-chains': cloneDeep(otherPermission),
          },
        },
      },
    });

    const newState = (await migration(state)) as typeof state;
    const permissions =
      newState.engine.backgroundState.PermissionController.subjects[
        'app.uniswap.org'
      ].permissions;

    expect(permissions.eth_accounts.caveats).toStrictEqual([
      { type: 'restrictReturnedAccounts', value: [ADDRESS_1] },
    ]);
    expect(permissions['endowment:permitted-chains']).toStrictEqual(
      otherPermission,
    );
  });

  it('should transform every caveat of every subject', async () => {
    const ethAccounts = (invoker: string, caveats: unknown[]) => ({
      eth_accounts: {
        id: `${invoker}-id`,
        parentCapability: 'eth_accounts',
        invoker,
        caveats,
        date: 1714709418138,
      },
    });
    const state = buildState({
      subjects: {
        'app.uniswap.org': {
          origin: 'app.uniswap.org',
          permissions: ethAccounts('app.uniswap.org', [
            {
              type: 'restrictReturnedAccounts',
              value: [
                { address: ADDRESS_1, lastUsed: 1 },
                { address: ADDRESS_2, lastUsed: 2 },
              ],
            },
            {
              type: 'otherCaveat',
              value: [{ address: ADDRESS_3, lastUsed: 3 }],
            },
          ]),
        },
        'opensea.io': {
          origin: 'opensea.io',
          permissions: ethAccounts('opensea.io', [
            {
              type: 'restrictReturnedAccounts',
              value: [{ address: ADDRESS_3, lastUsed: 4 }],
            },
          ]),
        },
      },
    });

    expect(await migration(state)).toStrictEqual(
      buildState({
        subjects: {
          'app.uniswap.org': {
            origin: 'app.uniswap.org',
            permissions: ethAccounts('app.uniswap.org', [
              {
                type: 'restrictReturnedAccounts',
                value: [ADDRESS_1, ADDRESS_2],
              },
              { type: 'otherCaveat', value: [ADDRESS_3] },
            ]),
          },
          'opensea.io': {
            origin: 'opensea.io',
            permissions: ethAccounts('opensea.io', [
              { type: 'restrictReturnedAccounts', value: [ADDRESS_3] },
            ]),
          },
        },
      }),
    );
  });

  it('should keep already-migrated string caveat values (idempotent)', async () => {
    const firstRun = await migration(cloneDeep(oldState));
    const secondRun = await migration(cloneDeep(firstRun));

    expect(secondRun).toStrictEqual(expectedNewState);
  });

  it('should keep string entries when caveat values are partially migrated', async () => {
    const state = buildState({
      subjects: {
        'app.uniswap.org': {
          origin: 'app.uniswap.org',
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [ADDRESS_1, { address: ADDRESS_2, lastUsed: 2 }],
                },
              ],
            },
          },
        },
      },
    });

    const newState = (await migration(state)) as typeof state;

    expect(
      newState.engine.backgroundState.PermissionController.subjects[
        'app.uniswap.org'
      ].permissions.eth_accounts.caveats[0].value,
    ).toStrictEqual([ADDRESS_1, ADDRESS_2]);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', ADDRESS_1],
    ['an object', { address: ADDRESS_1 }],
    ['a number', 42],
  ])(
    'should not throw and leave the caveat unchanged if its value is %s',
    async (_scenario, value) => {
      const state = buildState({
        subjects: {
          'app.uniswap.org': {
            origin: 'app.uniswap.org',
            permissions: {
              eth_accounts: {
                caveats: [
                  { type: 'restrictReturnedAccounts', value },
                  {
                    type: 'restrictReturnedAccounts',
                    value: [{ address: ADDRESS_2, lastUsed: 2 }],
                  },
                ],
              },
            },
          },
        },
      });

      const newState = (await migration(state)) as typeof state;

      expect(
        newState.engine.backgroundState.PermissionController.subjects[
          'app.uniswap.org'
        ].permissions.eth_accounts.caveats,
      ).toStrictEqual([
        { type: 'restrictReturnedAccounts', value },
        { type: 'restrictReturnedAccounts', value: [ADDRESS_2] },
      ]);
    },
  );

  it('should not throw on non-object caveats or malformed caveat entries', async () => {
    const state = buildState({
      subjects: {
        'app.uniswap.org': {
          origin: 'app.uniswap.org',
          permissions: {
            eth_accounts: {
              caveats: [
                null,
                'invalid',
                {
                  type: 'restrictReturnedAccounts',
                  value: [null, 7, { lastUsed: 1 }, { address: 123 }],
                },
              ],
            },
          },
        },
      },
    });
    const expected = cloneDeep(state);

    expect(await migration(state)).toStrictEqual(expected);
  });
});
