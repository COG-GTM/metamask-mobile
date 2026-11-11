import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import AnnouncementDescriptionField from './AnnouncementDescriptionField';
import { ModalFieldType } from '../../../../../util/notifications';

const renderWithLink = (href: string) =>
  render(
    <AnnouncementDescriptionField
      type={ModalFieldType.ANNOUNCEMENT_DESCRIPTION}
      description={`<p><a href="${href}">Open link</a></p>`}
    />,
  );

describe('AnnouncementDescriptionField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens https links', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText } = renderWithLink('https://metamask.io/news');

    fireEvent.press(getByText('Open link'));

    expect(openURL).toHaveBeenCalledWith('https://metamask.io/news');
  });

  it.each([
    'http://metamask.io',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'metamask://wc?uri=x',
    'wc:abc@2',
    'about:blank',
  ])('does not open non-https link %s', (href) => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText } = renderWithLink(href);

    fireEvent.press(getByText('Open link'));

    expect(openURL).not.toHaveBeenCalled();
  });
});
