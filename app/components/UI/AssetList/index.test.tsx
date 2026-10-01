import React from 'react';
import { render } from '@testing-library/react-native';
import AssetList from './';

describe('AssetList', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <AssetList
        searchQuery={''}
        searchResults={[]}
        handleSelectAsset={undefined}
        selectedAsset={{ address: '0xABC', symbol: 'ABC' }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
