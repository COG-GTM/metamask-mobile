import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import Row from './Row';

describe('Row', () => {
  it('renders children inside a View', () => {
    const { toJSON, getByText } = render(
      <Row>
        <Text>row-child</Text>
      </Row>,
    );
    expect(getByText('row-child')).toBeDefined();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with the `first` and `last` modifiers without crashing', () => {
    const { toJSON } = render(
      <Row first last>
        <Text>modifier-child</Text>
      </Row>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
