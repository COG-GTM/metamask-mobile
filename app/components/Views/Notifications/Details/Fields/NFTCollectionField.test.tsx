import React from 'react';
import NFTCollectionField from './NFTCollectionField';
import { ModalFieldType } from '../../../../../util/notifications';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';

jest.mock('../../../../../../locales/i18n', () => ({
  strings: jest.fn((key: string) => key),
}));

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('NFTCollectionField', () => {
  const baseProps = {
    type: ModalFieldType.NFT_COLLECTION_IMAGE as const,
    collectionImageUrl: 'https://example.com/collection.png',
    networkBadgeUrl: 'https://example.com/network.png',
    collectionName: 'Pixel Birds',
  };

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <NFTCollectionField {...baseProps} />,
      { state: mockInitialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the collection name and localization key for label', () => {
    const { getByText } = renderWithProvider(
      <NFTCollectionField {...baseProps} />,
      { state: mockInitialState },
    );
    expect(getByText('collectible.collection')).toBeDefined();
    expect(getByText('Pixel Birds')).toBeDefined();
  });

  it('accepts an ImageSourcePropType for networkBadgeUrl', () => {
    const { toJSON } = renderWithProvider(
      <NFTCollectionField
        {...baseProps}
        networkBadgeUrl={{ uri: 'https://example.com/img.png' }}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toBeTruthy();
  });
});
