// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import Text from './Text';

describe('Base Text', () => {
  it('renders plain text content', () => {
    const { getByText } = render(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('applies style modifier props without error', () => {
    const { toJSON } = render(
      <Text
        reset
        centered
        right
        bold
        green
        black
        blue
        red
        grey
        orange
        primary
        muted
        small
        big
        bigger
        upper
        modal
        infoModal
        disclaimer
        link
        strikethrough
        underline
        noMargin
      >
        Styled
      </Text>,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('passes through a custom style prop', () => {
    const { toJSON } = render(
      <Text style={{ color: 'red' }}>Custom style</Text>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
