// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Internal dependencies.
import BannerBase from './BannerBase';
import { TESTID_BANNER_CLOSE_BUTTON_ICON } from './BannerBase.constants';

describe('BannerBase', () => {
  it('renders title and description as strings', () => {
    const { getByText, toJSON } = render(
      <BannerBase title="Banner Title" description="Banner description" />,
    );
    expect(getByText('Banner Title')).toBeTruthy();
    expect(getByText('Banner description')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders a custom title node when title is not a string', () => {
    const { getByText } = render(
      <BannerBase
        title={<RNText>Custom Title Node</RNText>}
        description={<RNText>Custom Description</RNText>}
      />,
    );
    expect(getByText('Custom Title Node')).toBeTruthy();
    expect(getByText('Custom Description')).toBeTruthy();
  });

  it('renders a close button when onClose is provided and fires the handler', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <BannerBase title="T" description="D" onClose={onClose} />,
    );
    fireEvent.press(getByTestId(TESTID_BANNER_CLOSE_BUTTON_ICON));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders children inside the info section', () => {
    const { getByText } = render(
      <BannerBase title="T" description="D">
        <RNText>banner child</RNText>
      </BannerBase>,
    );
    expect(getByText('banner child')).toBeTruthy();
  });
});
