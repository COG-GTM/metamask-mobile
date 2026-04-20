import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import EstimatedAnnualRewardsCard from './EstimatedAnnualRewardsCard';

describe('EstimatedAnnualRewardsCard', () => {
  it('renders the provided rewards value and matches snapshot', () => {
    const onIconPress = jest.fn();
    const { getByText, toJSON } = render(
      <EstimatedAnnualRewardsCard
        estimatedAnnualRewards="3.2%"
        onIconPress={onIconPress}
      />,
    );

    expect(getByText('3.2%')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a skeleton placeholder instead of the rewards value when loading', () => {
    const { queryByText } = render(
      <EstimatedAnnualRewardsCard
        estimatedAnnualRewards="3.2%"
        onIconPress={jest.fn()}
        isLoading
      />,
    );

    expect(queryByText('3.2%')).toBeNull();
  });

  it('invokes onIconPress when the info icon is pressed', () => {
    const onIconPress = jest.fn();
    const { getByLabelText } = render(
      <EstimatedAnnualRewardsCard
        estimatedAnnualRewards="3.2%"
        onIconPress={onIconPress}
      />,
    );

    fireEvent.press(getByLabelText('Learn More'));

    expect(onIconPress).toHaveBeenCalledTimes(1);
  });
});
