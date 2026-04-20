import React from 'react';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import LoadingNetworksSkeleton from './LoadingNetworksSkeleton';

describe('LoadingNetworksSkeleton', () => {
  it('renders a column of skeleton rows', () => {
    const { toJSON } = renderWithProvider(<LoadingNetworksSkeleton />);
    expect(toJSON()).toMatchSnapshot();
  });
});
