import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import BlockaidBannerLink from './BlockaidBannerLink';

describe('BlockaidBannerLink', () => {
  const LINK = 'https://example.com/security';
  const TEXT = 'Learn more';

  beforeEach(() => {
    jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the supplied text (snapshot)', () => {
    const { toJSON, getByText } = render(
      <BlockaidBannerLink text={TEXT} link={LINK} />,
    );
    expect(getByText(TEXT)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('opens the link when pressed', () => {
    const { getByText } = render(
      <BlockaidBannerLink text={TEXT} link={LINK} />,
    );
    fireEvent.press(getByText(TEXT));
    expect(Linking.openURL).toHaveBeenCalledWith(LINK);
  });

  it('calls the onContactUsClicked callback before opening the link', () => {
    const onContactUsClicked = jest.fn();
    const { getByText } = render(
      <BlockaidBannerLink
        text={TEXT}
        link={LINK}
        onContactUsClicked={onContactUsClicked}
      />,
    );
    fireEvent.press(getByText(TEXT));
    expect(onContactUsClicked).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(LINK);
  });
});
