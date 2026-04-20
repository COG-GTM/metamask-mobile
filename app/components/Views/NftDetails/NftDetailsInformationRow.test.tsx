import React from 'react';
import { render } from '@testing-library/react-native';
import NftDetailsInformationRow from './NftDetailsInformationRow';

jest.mock('react-native-gesture-handler', () => {
  const { TouchableOpacity } = jest.requireActual('react-native');
  return { TouchableOpacity };
});

describe('NftDetailsInformationRow', () => {
  it('renders correctly with title and value', () => {
    const { getByText } = render(
      <NftDetailsInformationRow title="Token ID" value="1234" />,
    );
    expect(getByText('Token ID')).toBeDefined();
    expect(getByText('1234')).toBeDefined();
  });

  it('returns null when value is empty', () => {
    const { toJSON } = render(
      <NftDetailsInformationRow title="Token ID" value="" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <NftDetailsInformationRow title="Token ID" value="1234" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
