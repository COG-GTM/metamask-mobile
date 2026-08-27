import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { toJSON } = renderWithProvider(<OfflineMode />);
    expect(toJSON()).toMatchSnapshot();
  });
});
