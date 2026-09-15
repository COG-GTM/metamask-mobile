import React from 'react';
import { renderScreen } from '../../../../util/test/renderWithProvider';
import NetworksSettings from './';
import { backgroundState } from '../../../../util/test/initial-root-state';

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('NetworksSettings', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      NetworksSettings as unknown as React.ComponentType,
      { name: 'Network Settings' },
      {
        state: initialState,
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
