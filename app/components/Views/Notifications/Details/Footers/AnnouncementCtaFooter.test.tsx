import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import AnnouncementCtaFooter from './AnnouncementCtaFooter';
import { ModalFooterType } from '../../../../../util/notifications/constants/config';

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

describe('AnnouncementCtaFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when a mobileLink is provided', () => {
    const { toJSON } = render(
      <AnnouncementCtaFooter
        type={ModalFooterType.ANNOUNCEMENT_CTA}
        mobileLink={{
          extensionLinkText: 'Learn more',
          extensionLinkRoute: 'https://metamask.io/learn',
        }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('returns null when mobileLink is not provided', () => {
    const { toJSON } = render(
      <AnnouncementCtaFooter type={ModalFooterType.ANNOUNCEMENT_CTA} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('opens the extensionLinkRoute when the button is pressed', () => {
    const { getByText } = render(
      <AnnouncementCtaFooter
        type={ModalFooterType.ANNOUNCEMENT_CTA}
        mobileLink={{
          extensionLinkText: 'Learn more',
          extensionLinkRoute: 'https://metamask.io/learn',
        }}
      />,
    );
    fireEvent.press(getByText('Learn more'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://metamask.io/learn');
  });
});
