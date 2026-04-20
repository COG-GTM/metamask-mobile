import React from 'react';
import { render } from '@testing-library/react-native';
import { SnapUICard } from './SnapUICard';

jest.mock('../SnapUIImage/SnapUIImage', () => ({
  SnapUIImage: () => null,
}));

describe('SnapUICard', () => {
  it('renders the title and value', () => {
    const { getByText, getByTestId } = render(
      <SnapUICard title="Ether" value="1.0 ETH" />,
    );

    expect(getByTestId('snaps-ui-card')).toBeTruthy();
    expect(getByText('Ether')).toBeTruthy();
    expect(getByText('1.0 ETH')).toBeTruthy();
  });

  it('renders description and extra when provided', () => {
    const { getByText } = render(
      <SnapUICard
        title="Ether"
        description="The native token"
        value="1.0 ETH"
        extra="$3,000.00"
      />,
    );

    expect(getByText('The native token')).toBeTruthy();
    expect(getByText('$3,000.00')).toBeTruthy();
  });

  it('does not render description or extra when omitted', () => {
    const { queryByText } = render(
      <SnapUICard title="Ether" value="1.0 ETH" />,
    );

    expect(queryByText('The native token')).toBeNull();
    expect(queryByText('$3,000.00')).toBeNull();
  });

  it('renders the image when provided', () => {
    const { toJSON } = render(
      <SnapUICard
        image="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'></svg>"
        title="Ether"
        value="1.0 ETH"
      />,
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
