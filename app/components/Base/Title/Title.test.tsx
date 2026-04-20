// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import Title from './Title';

describe('Title', () => {
  it('renders its text content', () => {
    const { getByText } = render(<Title>Hello world</Title>);
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('matches snapshot when centered and hero are enabled', () => {
    const { toJSON } = render(
      <Title centered hero>
        Big title
      </Title>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
