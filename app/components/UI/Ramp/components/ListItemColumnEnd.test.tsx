import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import ListItemColumnEnd from './ListItemColumnEnd';

const extraStyle = StyleSheet.create({ padded: { padding: 4 } });

describe('ListItemColumnEnd', () => {
  it('renders children end-aligned', () => {
    const { toJSON, getByText } = render(
      <ListItemColumnEnd>
        <Text>end-child</Text>
      </ListItemColumnEnd>,
    );
    expect(getByText('end-child')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('merges an object style prop with the alignEnd style', () => {
    const { toJSON } = render(
      <ListItemColumnEnd style={extraStyle.padded}>
        <Text>styled</Text>
      </ListItemColumnEnd>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
