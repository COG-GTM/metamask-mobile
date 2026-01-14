import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  ImageStyle,
  NativeSyntheticEvent,
  ImageErrorEventData,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
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

interface RemoteImageSource {
  uri?: string;
  __packager_asset?: boolean;
  width?: number;
  height?: number;
}

export interface RemoteImageProps {
  fadeIn?: boolean;
  source: RemoteImageSource | ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  onError?: () => void;
  isUrl?: boolean;
  address?: string;
  isTokenImage?: boolean;
  isFullRatio?: boolean;
  chainId?: string;
  testID?: string;
}

const RemoteImage: React.FC<RemoteImageProps> = (props) => {
  const [error, setError] = useState<string | undefined>(undefined);
  // Avoid using this component with animated SVG
  const sourceWithUri = props.source as RemoteImageSource;
  const source = sourceWithUri;
  const isImageUrl = isUrl(sourceWithUri?.uri || '');
  const ipfsGateway = useIpfsGateway();
  const styles = createStyles();
  const currentChainId = useSelector(selectChainId);
  // The chainId would be passed in props from parent for collectible media
  const chainId = props.chainId ? toHex(props.chainId) : currentChainId;
  const networkName = useSelector(selectNetworkName);
  const [resolvedIpfsUrl, setResolvedIpfsUrl] = useState<string | false>(false);

  const uri =
    resolvedIpfsUrl ||
    (source.uri === undefined || source.uri?.startsWith('ipfs')
      ? ''
      : source.uri);

  const onError = ({
    nativeEvent: { error: errorMessage },
  }: NativeSyntheticEvent<ImageErrorEventData>) => setError(errorMessage);

  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    resolveIpfsUrl();
    async function resolveIpfsUrl() {
      try {
        const url = new URL(sourceWithUri.uri || '');
        if (url.protocol !== 'ipfs:') {
          setResolvedIpfsUrl(false);
          return;
        }
        const ipfsUrl = await getFormattedIpfsUrl(
          ipfsGateway,
          sourceWithUri.uri || '',
          false,
        );
        setResolvedIpfsUrl(ipfsUrl);
      } catch (err) {
        setResolvedIpfsUrl(false);
      }
    }
  }, [sourceWithUri.uri, ipfsGateway]);

  useEffect(() => {
    const calculateImageDimensions = (
      imageWidth: number,
      imageHeight: number,
    ): ImageDimensions => {
      const deviceWidth = Dimensions.get('window').width;
      const maxWidth = deviceWidth - 32;
      const maxHeight = 0.75 * maxWidth;

      if (imageWidth > imageHeight) {
        // Horizontal image
        const width = maxWidth;
        const height = (imageHeight / imageWidth) * maxWidth;
        return { width, height };
      } else if (imageHeight > imageWidth) {
        // Vertical image
        const height = maxHeight;
        const width = (imageWidth / imageHeight) * maxHeight;
        return { width, height };
      }
      // Square image
      return { width: maxHeight, height: maxHeight };
    };

    if (uri) {
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
    }
  }, [uri]);

  const NetworkBadgeSource = useCallback((): ImageSourcePropType | undefined => {
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
    const customNetworkImg =
      CustomNetworkImgMapping[chainId as keyof typeof CustomNetworkImgMapping];

    if (network) {
      return network.rpcPrefs.imageSource;
    } else if (customNetworkImg) {
      return customNetworkImg as ImageSourcePropType;
    }
    return undefined;
  }, [chainId]);

  const isSVG =
    source &&
    source.uri &&
    source.uri.match('.svg') &&
    (isImageUrl || resolvedIpfsUrl);

  const viewbox = useSvgUriViewBox(uri || '', Boolean(isSVG));

  if (error && props.address) {
    return (
      <Identicon
        address={props.address}
        customStyle={props.style as ImageStyle}
      />
    );
  }

  if (isSVG) {
    const style = (props.style || {}) as ViewStyle & {
      width?: number;
      height?: number;
    };
    if (source.__packager_asset && typeof style !== 'number') {
      if (!style.width) {
        style.width = source.width;
      }
      if (!style.height) {
        style.height = source.height;
      }
    }

    return (
      <ComponentErrorBoundary
        onError={props.onError}
        componentLabel="RemoteImage-SVG"
      >
        <View style={{ ...style, ...styles.svgContainer }}>
          <SvgUri
            {...props}
            uri={uri || ''}
            width={'100%'}
            height={'100%'}
            viewBox={viewbox}
          />
        </View>
      </ComponentErrorBoundary>
    );
  }

  if (props.fadeIn) {
    const { style, ...restProps } = props;
    const badge = {
      top: -4,
      right: -4,
    };
    return (
      <>
        {props.isTokenImage ? (
          <FadeIn placeholderStyle={props.placeholderStyle}>
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
                    source={{ uri: uri || '' }}
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
                  <View style={style}>
                    <Image
                      style={styles.imageStyle}
                      {...restProps}
                      source={{ uri: uri || '' }}
                      onError={onError}
                      resizeMode={'cover'}
                    />
                  </View>
                </BadgeWrapper>
              )}
            </View>
          </FadeIn>
        ) : (
          <FadeIn placeholderStyle={props.placeholderStyle}>
            <Image
              style={props.style}
              source={{ uri: uri || '' }}
              onError={onError}
            />
          </FadeIn>
        )}
      </>
    );
  }

  return (
    <Image style={props.style} source={{ uri: uri || '' }} onError={onError} />
  );
};

export default RemoteImage;
