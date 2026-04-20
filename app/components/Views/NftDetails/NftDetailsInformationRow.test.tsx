import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import NftDetailsInformationRow from './NftDetailsInformationRow';

describe('NftDetailsInformationRow', () => {
  it('renders nothing when value is not provided', () => {
    const { toJSON } = render(
      <NftDetailsInformationRow title="Price" value={undefined} />,
    );

    expect(toJSON()).toBeNull();
  });

  it('renders the title and value and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <NftDetailsInformationRow title="Owner" value="0xabc" />,
    );

    expect(getByText('Owner')).toBeDefined();
    expect(getByText('0xabc')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders icon alongside the value when icon is provided', () => {
    const { getByText } = render(
      <NftDetailsInformationRow
        title="Source"
        value="OpenSea"
        icon={<Text>icon-node</Text>}
      />,
    );

    expect(getByText('OpenSea')).toBeDefined();
    expect(getByText('icon-node')).toBeDefined();
  });

  it('invokes onValuePress when value is pressed and both icon and onValuePress are provided', () => {
    const onValuePress = jest.fn();
    const { getByText } = render(
      <NftDetailsInformationRow
        title="Link"
        value="View"
        icon={<Text>icon</Text>}
        onValuePress={onValuePress}
      />,
    );

    fireEvent.press(getByText('View'));

    expect(onValuePress).toHaveBeenCalledTimes(1);
  });
});
