import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import NftDetailsBox from './NftDetailsBox';

jest.mock('../../../util/theme', () => ({
  useTheme: () => ({
    colors: {
      border: { default: '#D6D9DC' },
    },
  }),
}));

describe('NftDetailsBox', () => {
  it('renders null when value is empty', () => {
    const { toJSON } = render(<NftDetailsBox title="Title" />);
    expect(toJSON()).toBeNull();
  });

  it('renders with title and value', () => {
    const { getByText } = render(
      <NftDetailsBox title="Token ID" value="1234" />,
    );
    expect(getByText('Token ID')).toBeTruthy();
    expect(getByText('1234')).toBeTruthy();
  });

  it('renders with icon and onValuePress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <NftDetailsBox
        title="Title"
        value="Value"
        icon={<Text>Icon</Text>}
        onValuePress={onPress}
      />,
    );
    expect(getByText('Value')).toBeTruthy();
    expect(getByText('Icon')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <NftDetailsBox title="Token ID" value="1234" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
