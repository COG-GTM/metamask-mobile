jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
  withMetricsAwareness: (component: any) => component,
}));

jest.mock('../../UI/Navbar', () => ({
  __esModule: true,
  default: 'Navbar',
  getNftDetailsNavbarOptions: jest.fn().mockReturnValue({}),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      address: '0x1234',
      tokenId: '1',
    },
  }),
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    NftController: {
      removeAndIgnoreNft: jest.fn(),
      addNft: jest.fn(),
    },
    PreferencesController: {
      state: { selectedAddress: '0x1234' },
    },
  },
}));

jest.mock('../../UI/ReusableModal', () => {
  const { forwardRef } = require('react');
  const { View } = require('react-native');
  return forwardRef((props: any, _ref: any) => <View>{props.children}</View>);
});

jest.mock('../../UI/StyledButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return (props: any) => (
    <TouchableOpacity onPress={props.onPress}>
      <Text>{props.children}</Text>
    </TouchableOpacity>
  );
});

describe('NftDetails', () => {
  it('module exports correctly', () => {
    const mod = require('./NftDetails');
    expect(mod).toBeDefined();
  });
});
