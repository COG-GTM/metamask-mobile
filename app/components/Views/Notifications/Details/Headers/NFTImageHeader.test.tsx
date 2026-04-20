import React from 'react';
import NFTImageHeader from './NFTImageHeader';
import { ModalHeaderType } from '../../../../../util/notifications/constants/config';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('NFTImageHeader', () => {
  const baseProps = {
    type: ModalHeaderType.NFT_IMAGE as const,
    nftImageUrl: 'https://example.com/nft.png',
    networkBadgeUrl: 'https://example.com/network.png',
  };

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<NFTImageHeader {...baseProps} />, {
      state: mockInitialState,
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('accepts an ImageSourcePropType value for networkBadgeUrl', () => {
    const { toJSON } = renderWithProvider(
      <NFTImageHeader
        {...baseProps}
        networkBadgeUrl={{ uri: 'https://example.com/img.png' }}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders without a network badge url', () => {
    const { toJSON } = renderWithProvider(
      <NFTImageHeader
        type={ModalHeaderType.NFT_IMAGE}
        nftImageUrl={baseProps.nftImageUrl}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toBeTruthy();
  });
});
