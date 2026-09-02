import { renderScreen } from '../../../../util/test/renderWithProvider';
import React from 'react';
import NetworksSettings from './';

const NetworksSettingsView = NetworksSettings as unknown as React.ComponentType;
import { backgroundState } from '../../../../util/test/initial-root-state';

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('NetworksSettings', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      NetworksSettingsView,
      { name: 'Network Settings' },
      {
        state: initialState,
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
