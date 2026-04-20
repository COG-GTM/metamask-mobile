import React from 'react';
import { render } from '@testing-library/react-native';
import NftDetailsFullImage from './NFtDetailsFullImage';

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    setOptions: mockSetOptions,
  }),
}));

jest.mock('../../../util/navigation/navUtils', () => ({
  ...jest.requireActual('../../../util/navigation/navUtils'),
  useParams: () => ({
    collectible: {
      address: '0xabc',
      tokenId: '1',
      name: 'MockNft',
      image: 'image-url',
      standard: 'ERC721',
    },
  }),
}));

jest.mock('../../../components/UI/CollectibleMedia', () => {
  const { View } = jest.requireActual('react-native');
  return ({ collectible }: { collectible: { name: string } }) => (
    <View testID={`media-${collectible.name}`} />
  );
});

describe('NftDetailsFullImage', () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
  });

  it('renders the collectible media component and matches snapshot', () => {
    const { getByTestId, toJSON } = render(<NftDetailsFullImage />);

    expect(getByTestId('media-MockNft')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('sets navigation options on mount', () => {
    render(<NftDetailsFullImage />);

    expect(mockSetOptions).toHaveBeenCalled();
  });
});
