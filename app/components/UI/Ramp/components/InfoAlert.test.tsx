import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import InfoAlert from './InfoAlert';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';

const mockTrackEvent = jest.fn();
jest.mock('../hooks/useAnalytics', () => () => mockTrackEvent);

const defaultState = { engine: { backgroundState } };

const SAFE_LINKS = {
  providerWebsite: 'https://provider.example',
  providerPrivacyPolicy: 'https://provider.example/privacy',
  providerTermsOfService: 'https://provider.example/terms',
  providerSupport: 'https://provider.example/support',
};

const UNSAFE_LINKS = {
  providerWebsite: 'evilapp://x',
  providerPrivacyPolicy: 'metamask://wc?uri=attacker',
  providerTermsOfService: 'intent://scan/#Intent;scheme=evil;end',
  providerSupport: ['java', 'script:alert(1)'].join(''),
};

const renderInfoAlert = (links: Partial<typeof SAFE_LINKS>) =>
  renderWithProvider(
    <InfoAlert isVisible providerName="Test Provider" {...links} />,
    { state: defaultState },
  );

describe('InfoAlert provider links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'Provider Homepage',
      SAFE_LINKS.providerWebsite,
      SAFE_LINKS.providerWebsite,
    ],
    [
      'Provider Privacy Policy',
      'Privacy Policy',
      SAFE_LINKS.providerPrivacyPolicy,
    ],
    [
      'Provider Terms of Service',
      'Terms of Service',
      SAFE_LINKS.providerTermsOfService,
    ],
    ['Provider Support', 'Test Provider Support', SAFE_LINKS.providerSupport],
  ])('opens the https %s link', (eventText, label, url) => {
    renderInfoAlert(SAFE_LINKS);

    fireEvent.press(screen.getByText(label));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(url);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'ONRAMP_EXTERNAL_LINK_CLICKED',
      {
        location: 'Quotes Screen',
        text: eventText,
        url_domain: url,
      },
    );
  });

  it('does not render or open non-http(s) provider links', () => {
    renderInfoAlert(UNSAFE_LINKS);

    expect(screen.queryByText(UNSAFE_LINKS.providerWebsite)).toBeNull();
    expect(screen.queryByText('Privacy Policy')).toBeNull();
    expect(screen.queryByText('Terms of Service')).toBeNull();
    expect(screen.queryByText('Test Provider Support')).toBeNull();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('keeps https links when other provider links are unsafe', () => {
    renderInfoAlert({
      ...UNSAFE_LINKS,
      providerPrivacyPolicy: SAFE_LINKS.providerPrivacyPolicy,
    });

    expect(screen.queryByText(UNSAFE_LINKS.providerWebsite)).toBeNull();
    fireEvent.press(screen.getByText('Privacy Policy'));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(
      SAFE_LINKS.providerPrivacyPolicy,
    );
  });
});
