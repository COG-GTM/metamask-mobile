import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import NftDetailsBox from './NftDetailsBox';

describe('NftDetailsBox', () => {
  it('renders nothing when the value prop is falsy', () => {
    const { toJSON } = render(<NftDetailsBox title="Floor" value={null} />);

    expect(toJSON()).toBeNull();
  });

  it('renders the title and value and matches snapshot', () => {
    const { getByText, toJSON } = render(
      <NftDetailsBox title="Floor Price" value="1.2 ETH" />,
    );

    expect(getByText('Floor Price')).toBeDefined();
    expect(getByText('1.2 ETH')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders icon alongside value when icon is provided', () => {
    const { getByText } = render(
      <NftDetailsBox
        title="Rank"
        value="#1"
        icon={<Text>icon-node</Text>}
      />,
    );

    expect(getByText('#1')).toBeDefined();
    expect(getByText('icon-node')).toBeDefined();
  });

  it('wraps value in a touchable area and invokes onValuePress when pressed', () => {
    const onValuePress = jest.fn();
    const { getByText } = render(
      <NftDetailsBox
        title="Link"
        value="View details"
        icon={<Text>icon</Text>}
        onValuePress={onValuePress}
      />,
    );

    fireEvent.press(getByText('View details'));

    expect(onValuePress).toHaveBeenCalledTimes(1);
  });
});
