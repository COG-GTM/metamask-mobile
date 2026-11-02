import {
  processNotification,
  TRIGGER_TYPES,
} from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationERC1155Received,
  createMockNotificationERC721Received,
} from '@metamask/notification-services-controller/notification-services/mocks';
import { renderHookWithProvider } from '../../test/renderWithProvider';
import { backgroundState } from '../../test/initial-root-state';
import { NotificationComponentState } from '../notification-states';
import {
  shouldDisplayNftMedia,
  useShouldDisplayNftMedia,
} from './useShouldDisplayNftMedia';

const HTTPS_URL = 'https://attacker.example/nft.png';
const IPFS_URL =
  'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

describe('shouldDisplayNftMedia', () => {
  it.each([
    [HTTPS_URL, true, true, true],
    [HTTPS_URL, true, false, true],
    [HTTPS_URL, false, true, false],
    [HTTPS_URL, false, false, false],
    [IPFS_URL, false, true, true],
    [IPFS_URL, false, false, false],
    ['', true, true, false],
    [undefined, true, true, false],
  ])(
    'uri %s, displayNftMedia %s, ipfsGateway %s -> %s',
    (uri, displayNftMedia, isIpfsGatewayEnabled, expected) => {
      expect(
        shouldDisplayNftMedia(uri, displayNftMedia, isIpfsGatewayEnabled),
      ).toBe(expected);
    },
  );
});

describe('useShouldDisplayNftMedia', () => {
  const stateWith = (
    displayNftMedia: boolean,
    isIpfsGatewayEnabled: boolean,
  ) => ({
    engine: {
      backgroundState: {
        ...backgroundState,
        PreferencesController: {
          ...backgroundState.PreferencesController,
          displayNftMedia,
          isIpfsGatewayEnabled,
        },
      },
    },
  });

  it('reads the Display NFT media preference', () => {
    expect(
      renderHookWithProvider(() => useShouldDisplayNftMedia(HTTPS_URL), {
        state: stateWith(false, true),
      }).result.current,
    ).toBe(false);
    expect(
      renderHookWithProvider(() => useShouldDisplayNftMedia(HTTPS_URL), {
        state: stateWith(true, false),
      }).result.current,
    ).toBe(true);
  });
});

describe('NFT notification states', () => {
  it.each([
    [TRIGGER_TYPES.ERC721_RECEIVED, createMockNotificationERC721Received],
    [TRIGGER_TYPES.ERC1155_RECEIVED, createMockNotificationERC1155Received],
  ] as const)(
    'marks the %s menu item image as NFT media',
    (trigger, createMock) => {
      const notification = processNotification(createMock());
      const state = NotificationComponentState[trigger] as unknown as {
        createMenuItem: (n: typeof notification) => {
          image?: { isNftMedia?: boolean };
        };
      };
      expect(state.createMenuItem(notification).image?.isNftMedia).toBe(true);
    },
  );
});
