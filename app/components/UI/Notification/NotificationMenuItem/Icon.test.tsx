import React from 'react';
import { Linking } from 'react-native';

import renderWithProvider from '../../../../util/test/renderWithProvider';

import NotificationIcon from './Icon';
import { IconName } from '../../../../component-library/components/Icons/Icon';
import initialBackgroundState from '../../../../util/test/initial-background-state.json';

import SVG_ETH_LOGO_PATH from '../../../../component-library/components/Icons/Icon/assets/ethereum.svg';
import type { RootState } from '../../../../reducers';

Linking.openURL = jest.fn(() => Promise.resolve('opened https://metamask.io!'));

const mockInitialState = {
  engine: {
    backgroundState: {
      ...initialBackgroundState,
    },
  },
} as unknown as RootState;

describe('NotificationIcon', () => {
  const walletNotification = {
    badgeIcon: IconName.Send,
    imageUrl: SVG_ETH_LOGO_PATH,
  };

  it('matches snapshot when icon is provided', () => {
    const { toJSON } = renderWithProvider(
      <NotificationIcon
        image={{ url: walletNotification.imageUrl.name }}
        badgeIcon={walletNotification.badgeIcon}
      />,
      { state: mockInitialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('NotificationIcon NFT media gating', () => {
  const ATTACKER_URL = 'https://attacker.example/track.png';

  const stateWith = (displayNftMedia: boolean) =>
    ({
      engine: {
        backgroundState: {
          ...initialBackgroundState,
          PreferencesController: {
            ...initialBackgroundState.PreferencesController,
            displayNftMedia,
            isIpfsGatewayEnabled: false,
          },
        },
      },
    } as unknown as RootState);

  const hasRemoteImage = (
    root: ReturnType<typeof renderWithProvider>['UNSAFE_root'],
  ) =>
    root.findAll(
      (node) =>
        typeof node.type !== 'string' &&
        (node.props?.source as { uri?: string } | undefined)?.uri ===
          ATTACKER_URL,
    ).length > 0;

  it('renders a local fallback for NFT media when Display NFT media is off', () => {
    const { getByTestId, UNSAFE_root } = renderWithProvider(
      <NotificationIcon
        image={{ url: ATTACKER_URL, variant: 'square', isNftMedia: true }}
        badgeIcon={IconName.Received}
      />,
      { state: stateWith(false) },
    );
    expect(getByTestId('notification-menu-icon-nft-fallback')).toBeTruthy();
    expect(hasRemoteImage(UNSAFE_root)).toBe(false);
  });

  it('loads NFT media when Display NFT media is on', () => {
    const { queryByTestId, UNSAFE_root } = renderWithProvider(
      <NotificationIcon
        image={{ url: ATTACKER_URL, variant: 'square', isNftMedia: true }}
        badgeIcon={IconName.Received}
      />,
      { state: stateWith(true) },
    );
    expect(queryByTestId('notification-menu-icon-nft-fallback')).toBeNull();
    expect(hasRemoteImage(UNSAFE_root)).toBe(true);
  });

  it('does not gate non-NFT notification images', () => {
    const { queryByTestId, UNSAFE_root } = renderWithProvider(
      <NotificationIcon
        image={{ url: ATTACKER_URL }}
        badgeIcon={IconName.Received}
      />,
      { state: stateWith(false) },
    );
    expect(queryByTestId('notification-menu-icon-nft-fallback')).toBeNull();
    expect(hasRemoteImage(UNSAFE_root)).toBe(true);
  });
});
