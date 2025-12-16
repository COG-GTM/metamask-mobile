import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageStyle,
  NativeSyntheticEvent,
  ImageErrorEventData,
  ImageSourcePropType,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
// eslint-disable-next-line import/default
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

interface ImageSource {
  uri?: string;
  width?: number;
  height?: number;
  __packager_asset?: boolean;
}

interface RemoteImageProps {
  fadeIn?: boolean;
  source: ImageSourcePropType | ImageSource;
  style?: StyleProp<ViewStyle | ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  onError?: (error: string) => void;
  isUrl?: boolean;
  address?: string;
  isTokenImage?: boolean;
  isFullRatio?: boolean;
  chainId?: string;
}

const RemoteImage = (props: RemoteImageProps) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const source = resolveAssetSource(props.source) as ImageSource;
  const isImageUrl = isUrl(source?.uri || '');
  const ipfsGateway = useIpfsGateway();
  const styles = createStyles();
  const currentChainId = useSelector(selectChainId);
  const chainId = props.chainId ? toHex(props.chainId) : currentChainId;
  const networkName = useSelector(selectNetworkName);
  const [resolvedIpfsUrl, setResolvedIpfsUrl] = useState<string | false>(false);

  const uri =
    resolvedIpfsUrl ||
    (source.uri === undefined || source.uri?.startsWith('ipfs')
      ? ''
      : source.uri);

  const onError = ({ nativeEvent: { error: errorMessage } }: NativeSyntheticEvent<ImageErrorEventData>) => 
    setError(errorMessage);

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    resolveIpfsUrl();
    async function resolveIpfsUrl() {
      try {
        const url = new URL(source.uri || '');
        if (url.protocol !== 'ipfs:') setResolvedIpfsUrl(false);
        const ipfsUrl = await getFormattedIpfsUrl(
          ipfsGateway,
          source.uri || '',
          false,
        );
        setResolvedIpfsUrl(ipfsUrl);
      } catch (err) {
        setResolvedIpfsUrl(false);
      }
    }
  }, [source.uri, ipfsGateway]);

  useEffect(() => {
    const calculateImageDimensions = (imageWidth: number, imageHeight: number) => {
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

    if (uri) {
      Image.getSize(
        uri,
        (width: number, height: number) => {
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
    const customNetworkImg = CustomNetworkImgMapping[chainId];

    if (network) {
      return network.rpcPrefs.imageSource;
    } else if (customNetworkImg) {
      return customNetworkImg;
    }
    return undefined;
  }, [chainId]);

  const isSVG =
    source &&
    source.uri &&
    source.uri.match('.svg') &&
    (isImageUrl || resolvedIpfsUrl);

  const viewbox = useSvgUriViewBox(uri || '', isSVG || false);

  if (error && props.address) {
    return <Identicon address={props.address} customStyle={props.style as StyleProp<ViewStyle>} />;
  }

  if (isSVG) {
    const style = (props.style || {}) as ViewStyle & { width?: number; height?: number };
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
                  <View style={style as StyleProp<ViewStyle>}>
                    <Image
                      style={styles.imageStyle}
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
              style={style as StyleProp<ImageStyle>} 
              source={{ uri: uri || '' }} 
              onError={onError} 
            />
          </FadeIn>
        )}
      </>
    );
  }

  return (
    <Image 
      style={props.style as StyleProp<ImageStyle>} 
      source={{ uri: uri || '' }} 
      onError={onError} 
    />
  );
};

export default RemoteImage;
