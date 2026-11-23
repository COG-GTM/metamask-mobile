import React from 'react';
import { renderScreen } from '../../../../util/test/renderWithProvider';
import NetworksSettingsComponent from './';
import { backgroundState } from '../../../../util/test/initial-root-state';

const NetworksSettings = NetworksSettingsComponent as unknown as React.ComponentType<
  Record<string, unknown>
>;


const initialState = {
  engine: {
    backgroundState,
  },
};

describe('NetworksSettings', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      NetworksSettings,
      { name: 'Network Settings' },
      {
        state: initialState,
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
