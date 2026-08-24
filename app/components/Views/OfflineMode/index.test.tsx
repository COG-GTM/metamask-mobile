import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode, { OfflineModeProps } from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <OfflineMode {...({} as unknown as OfflineModeProps)} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
