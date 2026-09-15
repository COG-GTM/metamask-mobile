import React, { ComponentType } from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineModeComponent from './';

const OfflineMode = OfflineModeComponent as unknown as ComponentType;

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(<OfflineMode />);
    expect(toJSON()).toMatchSnapshot();
  });
});
