import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Dimensions,
  ImageProps,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  ViewStyle,
  NativeSyntheticEvent,
  ImageErrorEventData,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
// eslint-disable-next-line import/default
// @ts-expect-error - no type definitions available for resolveAssetSource
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import { SvgUri } from 'react-native-svg';
import isUrl from 'is-url';
import ComponentErrorBoundary from '../../UI/ComponentErrorBoundary';
import useIpfsGateway from '../../hooks/useIpfsGateway';
import { getFormattedIpfsUrl } from '@metamask/assets-controllers';
import Identicon from '../../UI/Identicon';
import BadgeWrapper from '../../../component-library/components/Badges/BadgeWrapper';
import Badge, {
  BadgeVariant,
} from '../../../component-library/components/Badges/Badge';
import { useSelector } from 'react-redux';
import { selectChainId } from '../../../selectors/networkController';
import {
  getTestNetImageByChainId,
  isLineaMainnetChainId,
  isMainNet,
  isSolanaMainnet,
  isTestNet,
} from '../../../util/networks';
import images from 'images/image-icons';
import { selectNetworkName } from '../../../selectors/networkInfos';

import { BadgeAnchorElementShape } from '../../../component-library/components/Badges/BadgeWrapper/BadgeWrapper.types';
import useSvgUriViewBox from '../../hooks/useSvgUriViewBox';
import { AvatarSize } from '../../../component-library/components/Avatars/Avatar';
import Logger from '../../../util/Logger';
import { toHex } from '@metamask/controller-utils';
import {
  CustomNetworkImgMapping,
  PopularList,
  UnpopularNetworkList,
} from '../../../util/networks/customNetworks';

const createStyles = () =>
  StyleSheet.create({
    svgContainer: {
      overflow: 'hidden',
    },
    badgeWrapper: {
      flex: 1,
    },
    imageStyle: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    detailedImageStyle: {
      borderRadius: 8,
    },
  });

interface ImageDimensions {
  width: number;
  height: number;
}

interface RemoteImageProps extends Omit<ImageProps, 'source' | 'style'> {
  fadeIn?: boolean;
  source?: ImageSourcePropType;
  style?: StyleProp<ViewStyle | ImageStyle>;
  placeholderStyle?: StyleProp<ImageStyle>;
  onError?: () => void;
  isUrl?: boolean;
  address?: string;
  isTokenImage?: boolean;
  isFullRatio?: boolean;
  chainId?: string | number;
}

const RemoteImage = (props: RemoteImageProps) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const source = props.source ? resolveAssetSource(props.source) : { uri: '' };
  const isImageUrl = isUrl((props?.source as { uri?: string })?.uri || '');
  const ipfsGateway = useIpfsGateway();
  const styles = createStyles();
  const currentChainId = useSelector(selectChainId);
  const chainId = props.chainId ? toHex(props.chainId) : currentChainId;
  const networkName = useSelector(selectNetworkName);
  const [resolvedIpfsUrl, setResolvedIpfsUrl] = useState<string | false>(false);
  const sourceUri = (props.source as { uri?: string })?.uri;

  const uri =
    resolvedIpfsUrl ||
    (source.uri === undefined || source.uri?.startsWith('ipfs')
      ? ''
      : source.uri || '');

  const onError = ({ nativeEvent: { error: errorMessage } }: NativeSyntheticEvent<ImageErrorEventData>) => setError(errorMessage as string);

  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    resolveIpfsUrl();
    async function resolveIpfsUrl() {
      try {
        if (!sourceUri) {
          setResolvedIpfsUrl(false);
          return;
        }
        const url = new URL(sourceUri);
        if (url.protocol !== 'ipfs:') setResolvedIpfsUrl(false);
        const ipfsUrl = await getFormattedIpfsUrl(
          ipfsGateway,
          sourceUri || '',
          false,
        );
        setResolvedIpfsUrl(ipfsUrl);
      } catch (err) {
        setResolvedIpfsUrl(false);
      }
    }
  }, [sourceUri, ipfsGateway]);

  useEffect(() => {
    const calculateImageDimensions = (imageWidth: number, imageHeight: number): ImageDimensions => {
      const deviceWidth = Dimensions.get('window').width;
      const maxWidth = deviceWidth - 32;
      const maxHeight = 0.75 * maxWidth;

      if (imageWidth > imageHeight) {
        const width = maxWidth;
        const height = (imageHeight / imageWidth) * maxWidth;
        return { width, height };
      } else if (imageHeight > imageWidth) {
        const height = maxHeight;
        const width = (imageWidth / imageHeight) * maxHeight;
        return { width, height };
      }
      return { width: maxHeight, height: maxHeight };
    };

    Image.getSize(
      uri,
      (width, height) => {
        const { width: calculatedWidth, height: calculatedHeight } =
          calculateImageDimensions(width, height);
        setDimensions({ width: calculatedWidth, height: calculatedHeight });
      },
      () => {
        Logger.log('Failed to get image dimensions');
      },
    );
  }, [uri]);

  const NetworkBadgeSource = useCallback(() => {
    if (isTestNet(chainId)) return getTestNetImageByChainId(chainId);

    if (isMainNet(chainId)) return images.ETHEREUM;

    if (isLineaMainnetChainId(chainId)) return images['LINEA-MAINNET'];

    if (isSolanaMainnet(chainId)) return images.SOLANA;

    const unpopularNetwork = UnpopularNetworkList.find(
      (networkConfig) => networkConfig.chainId === chainId,
    );

    const popularNetwork = PopularList.find(
      (networkConfig) => networkConfig.chainId === chainId,
    );
    const network = unpopularNetwork || popularNetwork;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customNetworkImg = (CustomNetworkImgMapping as any)[chainId];

    if (network) {
      return network.rpcPrefs.imageSource;
    } else if (customNetworkImg) {
      return customNetworkImg;
    }
    return undefined;
  }, [chainId]);

  const isSVG =
    source?.uri?.match('.svg') &&
    (isImageUrl || resolvedIpfsUrl);

  const viewbox = useSvgUriViewBox(uri, isSVG);

  if (error && props.address) {
    return <Identicon address={props.address} customStyle={props.style as object} />;
  }

  if (isSVG) {
    const style = props.style || {};
    if (source.__packager_asset && typeof style !== 'number') {
      const styleObj = style as { width?: number; height?: number };
      if (!styleObj.width) {
        styleObj.width = source.width;
      }
      if (!styleObj.height) {
        styleObj.height = source.height;
      }
    }

    return (
      <ComponentErrorBoundary
        onError={props.onError}
        componentLabel="RemoteImage-SVG"
      >
        <View style={{ ...(style as object), ...styles.svgContainer }}>
          <SvgUri
            uri={uri}
            width={'100%'}
            height={'100%'}
            viewBox={viewbox}
          />
        </View>
      </ComponentErrorBoundary>
    );
  }

  if (props.fadeIn) {
    const {
      style: containerStyle,
      source: _ignoreSource,
      fadeIn: _ignoreFadeIn,
      placeholderStyle,
      isTokenImage,
      isFullRatio,
      address,
      chainId: _ignoreChainId,
      isUrl: _ignoreIsUrl,
      ...imageProps
    } = props;
    const badge = {
      top: -4,
      right: -4,
    };
    return (
      <>
        {props.isTokenImage ? (
          <FadeIn placeholderStyle={placeholderStyle}>
            <View>
              {props.isFullRatio && dimensions ? (
                <BadgeWrapper
                  badgePosition={badge}
                  anchorElementShape={BadgeAnchorElementShape.Rectangular}
                  badgeElement={
                    <Badge
                      variant={BadgeVariant.Network}
                      imageSource={NetworkBadgeSource()}
                      name={networkName}
                      isScaled={false}
                      size={AvatarSize.Md}
                    />
                  }
                >
                  <Image
                    source={{ uri }}
                    style={{
                      width: dimensions.width,
                      height: dimensions.height,
                      ...styles.detailedImageStyle,
                    }}
                  />
                </BadgeWrapper>
              ) : (
                <BadgeWrapper
                  badgePosition={badge}
                  anchorElementShape={BadgeAnchorElementShape.Rectangular}
                  badgeElement={
                    <Badge
                      variant={BadgeVariant.Network}
                      imageSource={NetworkBadgeSource()}
                      name={networkName}
                      isScaled={false}
                      size={AvatarSize.Xs}
                    />
                  }
                >
                  <View style={containerStyle}>
                    <Image
                      style={styles.imageStyle}
                      {...imageProps}
                      source={{ uri }}
                      onError={onError}
                      resizeMode={'cover'}
                    />
                  </View>
                </BadgeWrapper>
              )}
            </View>
          </FadeIn>
        ) : (
          <FadeIn placeholderStyle={placeholderStyle}>
            {containerStyle ? (
              <View style={containerStyle}>
                <Image {...imageProps} source={{ uri }} onError={onError} />
              </View>
            ) : (
              <Image {...imageProps} source={{ uri }} onError={onError} />
            )}
          </FadeIn>
        )}
      </>
    );
  }

  const {
    style: containerStyle,
    source: _ignoreSource,
    fadeIn: _ignoreFadeIn,
    placeholderStyle: _ignorePlaceholderStyle,
    isTokenImage: _ignoreIsTokenImage,
    isFullRatio: _ignoreIsFullRatio,
    address: _ignoreAddress,
    chainId: _ignoreChainId,
    isUrl: _ignoreIsUrl,
    ...imageProps
  } = props;

  if (containerStyle) {
    return (
      <View style={containerStyle}>
        <Image {...imageProps} source={{ uri }} onError={onError} />
      </View>
    );
  }

  return <Image {...imageProps} source={{ uri }} onError={onError} />;
};

export default RemoteImage;
