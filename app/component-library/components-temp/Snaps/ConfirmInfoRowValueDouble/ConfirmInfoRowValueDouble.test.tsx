// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import { ConfirmInfoRowValueDouble } from './ConfirmInfoRowValueDouble';
import { RowVariant } from '../../../../components/Snaps/SnapUIRenderer/components/row';

describe('ConfirmInfoRowValueDouble', () => {
  it('renders string left and right values as Text', () => {
    const { getByText } = render(
      <ConfirmInfoRowValueDouble left="left label" right="right value" />,
    );
    expect(getByText('left label')).toBeTruthy();
    expect(getByText('right value')).toBeTruthy();
  });

  it('renders ReactNode left and right values as-is', () => {
    const { getByText } = render(
      <ConfirmInfoRowValueDouble
        left={<RNText>custom-left</RNText>}
        right={<RNText>custom-right</RNText>}
      />,
    );
    expect(getByText('custom-left')).toBeTruthy();
    expect(getByText('custom-right')).toBeTruthy();
  });

  it('applies the critical variant color map to string left value', () => {
    const { toJSON } = render(
      <ConfirmInfoRowValueDouble
        left="critical"
        right="value"
        variant={RowVariant.Critical}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('applies the warning variant color map to string left value', () => {
    const { toJSON } = render(
      <ConfirmInfoRowValueDouble
        left="warning"
        right="value"
        variant={RowVariant.Warning}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
