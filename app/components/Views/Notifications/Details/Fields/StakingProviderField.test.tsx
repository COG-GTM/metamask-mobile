import React from 'react';
import StakingProviderField from './StakingProviderField';
import { ModalFieldType } from '../../../../../util/notifications';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';

const mockInitialState = {
  engine: {
    backgroundState,
  },
};

describe('StakingProviderField', () => {
  const baseProps = {
    type: ModalFieldType.STAKING_PROVIDER as const,
    tokenIconUrl: 'https://example.com/token.png',
    stakingProvider: 'Lido',
  };

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <StakingProviderField {...baseProps} />,
      { state: mockInitialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the staking provider name passed via props', () => {
    const { getByText } = renderWithProvider(
      <StakingProviderField {...baseProps} />,
      { state: mockInitialState },
    );
    expect(getByText('Lido')).toBeDefined();
  });

  it('renders a different staking provider when the prop changes', () => {
    const { getByText } = renderWithProvider(
      <StakingProviderField {...baseProps} stakingProvider="RocketPool" />,
      { state: mockInitialState },
    );
    expect(getByText('RocketPool')).toBeDefined();
  });
});
