import React from 'react';
import { render } from '@testing-library/react-native';
import NftDetailsFullImage from './NFtDetailsFullImage';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('../../../util/navigation/navUtils', () => ({
  useParams: () => ({
    collectible: {
      name: 'Test NFT',
      tokenId: '1',
      address: '0x123',
      image: 'https://example.com/nft.png',
    },
  }),
}));

jest.mock('../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {
      fullImageContainer: {},
      fullImageItem: {},
    },
    theme: {
      colors: {
        background: { default: '#FFFFFF' },
      },
    },
  }),
}));

jest.mock('../../UI/Navbar', () => ({
  getNftFullImageNavbarOptions: jest.fn(() => ({})),
}));

jest.mock('../../../components/UI/CollectibleMedia', () => 'CollectibleMedia');

describe('NftDetailsFullImage', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<NftDetailsFullImage />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<NftDetailsFullImage />);
    expect(toJSON()).toMatchSnapshot();
  });
});
