// Third party dependencies.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import Button from './Button';
import { ButtonVariants } from './Button.types';

describe('Button', () => {
  it('renders the Primary variant', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button
        variant={ButtonVariants.Primary}
        label="Primary"
        onPress={onPress}
      />,
    );
    expect(getByText('Primary')).toBeTruthy();
    fireEvent.press(getByText('Primary'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the Secondary variant', () => {
    const { getByText } = render(
      <Button
        variant={ButtonVariants.Secondary}
        label="Secondary"
        onPress={() => undefined}
      />,
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders the Link variant', () => {
    const { getByText } = render(
      <Button
        variant={ButtonVariants.Link}
        label="Link"
        onPress={() => undefined}
      />,
    );
    expect(getByText('Link')).toBeTruthy();
  });

  it('throws for an invalid variant', () => {
    expect(() =>
      render(
        // @ts-expect-error intentionally invalid
        <Button variant="unknown" label="x" onPress={() => undefined} />,
      ),
    ).toThrow('Invalid Button Variant');
  });
});
