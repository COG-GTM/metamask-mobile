import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const OfflineModeUntyped =
      OfflineMode as unknown as React.ComponentType;
    const { toJSON } = renderWithProvider(<OfflineModeUntyped />);
    expect(toJSON()).toMatchSnapshot();
  });
});
