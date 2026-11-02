import React from 'react';
import { Image } from 'react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import NFTImageHeader from './NFTImageHeader';
import NFTCollectionField from '../Fields/NFTCollectionField';
import {
  ModalFieldType,
  ModalHeaderType,
} from '../../../../../util/notifications/constants/config';

const ATTACKER_URL = 'https://attacker.example/track.png';
const IPFS_URL =
  'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

const stateWith = (displayNftMedia: boolean, isIpfsGatewayEnabled = true) => ({
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

const findImageWithUri = (
  root: ReturnType<typeof renderWithProvider>['UNSAFE_root'],
  uri: string,
) =>
  root.findAll(
    (node) =>
      typeof node.type !== 'string' &&
      (node.props?.source as { uri?: string } | undefined)?.uri === uri,
  );

describe('Notification NFT media gating', () => {
  let getSizeSpy: jest.SpyInstance;

  beforeEach(() => {
    getSizeSpy = jest
      .spyOn(Image, 'getSize')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    getSizeSpy.mockRestore();
  });

  describe('NFTImageHeader', () => {
    const renderHeader = (nftImageUrl: string, state: object) =>
      renderWithProvider(
        <NFTImageHeader
          type={ModalHeaderType.NFT_IMAGE}
          nftImageUrl={nftImageUrl}
        />,
        { state },
      );

    it('does not fetch the NFT image when Display NFT media is off', () => {
      const { getByTestId, UNSAFE_root } = renderHeader(
        ATTACKER_URL,
        stateWith(false),
      );

      expect(getByTestId('nft-image-header-fallback')).toBeTruthy();
      expect(findImageWithUri(UNSAFE_root, ATTACKER_URL)).toHaveLength(0);
      expect(getSizeSpy).not.toHaveBeenCalled();
    });

    it('loads the NFT image when Display NFT media is on', () => {
      const { queryByTestId, UNSAFE_root } = renderHeader(
        ATTACKER_URL,
        stateWith(true),
      );

      expect(queryByTestId('nft-image-header-fallback')).toBeNull();
      expect(
        findImageWithUri(UNSAFE_root, ATTACKER_URL).length,
      ).toBeGreaterThan(0);
      expect(getSizeSpy).toHaveBeenCalledWith(
        ATTACKER_URL,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('allows IPFS media through the IPFS gateway when Display NFT media is off', () => {
      const { queryByTestId } = renderHeader(IPFS_URL, stateWith(false, true));
      expect(queryByTestId('nft-image-header-fallback')).toBeNull();
    });

    it('blocks IPFS media when both Display NFT media and the IPFS gateway are off', () => {
      const { getByTestId } = renderHeader(IPFS_URL, stateWith(false, false));
      expect(getByTestId('nft-image-header-fallback')).toBeTruthy();
    });
  });

  describe('NFTCollectionField', () => {
    const renderField = (state: object) =>
      renderWithProvider(
        <NFTCollectionField
          type={ModalFieldType.NFT_COLLECTION_IMAGE}
          collectionName="Collection"
          collectionImageUrl={ATTACKER_URL}
        />,
        { state },
      );

    it('does not fetch the collection image when Display NFT media is off', () => {
      const { getByTestId, UNSAFE_root } = renderField(stateWith(false));

      expect(getByTestId('nft-collection-field-fallback')).toBeTruthy();
      expect(findImageWithUri(UNSAFE_root, ATTACKER_URL)).toHaveLength(0);
      expect(getSizeSpy).not.toHaveBeenCalled();
    });

    it('loads the collection image when Display NFT media is on', () => {
      const { queryByTestId, UNSAFE_root } = renderField(stateWith(true));

      expect(queryByTestId('nft-collection-field-fallback')).toBeNull();
      expect(
        findImageWithUri(UNSAFE_root, ATTACKER_URL).length,
      ).toBeGreaterThan(0);
    });
  });
});
