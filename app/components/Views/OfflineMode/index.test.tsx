import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

const OfflineModeScreen = OfflineMode as unknown as React.ComponentType;

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(<OfflineModeScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
