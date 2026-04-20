import React from 'react';
import { Alert } from 'react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import NftOptions from './NftOptions';
import { backgroundState } from '../../../util/test/initial-root-state';

const mockNavigate = jest.fn();
const mockDismissModal = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
  };
});

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
  MetaMetricsEvents: {
    COLLECTIBLE_REMOVED: 'COLLECTIBLE_REMOVED',
  },
}));

jest.mock('../../UI/ReusableModal', () => {
  const { forwardRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: forwardRef(({ children }: { children: React.ReactNode }, _ref: React.Ref<unknown>) => (
      <View>{children}</View>
    )),
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    NftController: {
      removeAndIgnoreNft: jest.fn(),
    },
  },
}));

jest.mock('../../../actions/collectibles', () => ({
  removeFavoriteCollectible: jest.fn(),
}));

jest.mock('../../../selectors/accountsController', () => ({
  selectSelectedInternalAccountFormattedAddress: jest.fn(
    () => '0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756',
  ),
}));

jest.mock('../../../selectors/networkController', () => ({
  selectChainId: jest.fn(() => '0x1'),
  selectEvmNetworkConfigurationsByChainId: jest.fn(() => ({})),
}));

const initialState = {
  engine: {
    backgroundState,
  },
};

const mockRoute = {
  params: {
    collectible: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      tokenId: '123',
      chainId: 1,
      name: 'Test NFT',
      image: 'https://example.com/nft.png',
    },
  },
};

describe('NftOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <NftOptions route={mockRoute} />,
      { state: initialState },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders remove NFT option', () => {
    const { getByText } = renderWithProvider(
      <NftOptions route={mockRoute} />,
      { state: initialState },
    );
    expect(getByText('Remove NFT')).toBeDefined();
  });
});
