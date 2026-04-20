import React from 'react';
import { render } from '@testing-library/react-native';
import Button from './Button';
import { ButtonVariants } from './Button.types';

describe('Button', () => {
  it('renders primary variant correctly', () => {
    const { toJSON } = render(
      <Button variant={ButtonVariants.Primary} label="Click me" onPress={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { toJSON } = render(
      <Button variant={ButtonVariants.Secondary} label="Secondary" onPress={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <Button variant={ButtonVariants.Primary} label="Click me" onPress={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
