// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import KeyValueSection from './KeyValueSection';
import { KeyValueRowSectionAlignments } from '../KeyValueRow.types';

describe('KeyValueSection', () => {
  it('renders its children with default alignment', () => {
    const { getByText } = render(
      <KeyValueSection>
        <RNText>section-child</RNText>
      </KeyValueSection>,
    );
    expect(getByText('section-child')).toBeTruthy();
  });

  it('accepts a custom alignment prop', () => {
    const { toJSON } = render(
      <KeyValueSection align={KeyValueRowSectionAlignments.RIGHT}>
        <RNText>child</RNText>
      </KeyValueSection>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
