import migrate000 from './000';
import migrate001 from './001';
import migrate002 from './002';
import migrate003 from './003';
import migrate004 from './004';
import migrate005 from './005';
import migrate006 from './006';
import migrate007 from './007';
import migrate008 from './008';
import migrate009 from './009';
import migrate010 from './010';
import migrate011 from './011';
import migrate012 from './012';
import migrate013 from './013';
import migrate014 from './014';
import migrate015 from './015';
import migrate016 from './016';
import migrate017 from './017';
import migrate018 from './018';

jest.mock('react-native-default-preference', () => ({
  set: jest.fn(),
}));

const createState = () => ({
  engine: {
    backgroundState: {
      AddressBookController: { addressBook: {} },
      AssetsController: {
        allTokens: {},
        ignoredTokens: [],
        allCollectibles: {},
        allCollectibleContracts: {},
        ignoredCollectibles: [],
      },
      TokensController: {
        tokens: [],
        allTokens: {},
        ignoredTokens: [],
        allIgnoredTokens: {},
      },
      CollectiblesController: {
        allCollectibles: {},
        allCollectibleContracts: {},
        ignoredCollectibles: [],
      },
      NetworkController: {
        provider: { type: 'mainnet', chainId: '1' },
        providerConfig: { chainId: '1' },
        properties: {},
      },
      PreferencesController: {},
      NftController: {},
      NftDetectionController: {},
      CollectibleDetectionController: {},
      PermissionController: {},
    },
  },
  analytics: { enabled: false },
  privacy: { approvedHosts: {} },
  networkOnboarded: { networkOnboardedState: {} },
});

describe('legacy store migrations 000 through 018', () => {
  const migrations = [
    migrate000,
    migrate001,
    migrate002,
    migrate003,
    migrate004,
    migrate005,
    migrate006,
    migrate007,
    migrate008,
    migrate009,
    migrate010,
    migrate011,
    migrate012,
    migrate013,
    migrate014,
    migrate015,
    migrate016,
    migrate017,
    migrate018,
  ];

  it.each(migrations)('preserves a valid persisted state for migration %#', (migrate) => {
    const state = createState();
    const result = migrate(state);

    expect(result).toEqual(expect.any(Object));
  });
});
