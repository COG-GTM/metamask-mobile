import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageStyle,
  ImageProps,
  ImageSourcePropType,
  ImageURISource,
  ImageResolvedAssetSource,
  ImageErrorEventData,
  NativeSyntheticEvent,
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
import { Hex } from '@metamask/utils';
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

interface RemoteImageProps
  extends Omit<Partial<ImageProps>, 'source' | 'style' | 'onError'> {
  /**
   * Flag that determines the fade in behavior
   */
  fadeIn?: boolean;
  /**
   * Source of the image
   */
  source?: ImageSourcePropType;
  /**
   * Style for the image
   */
  style?: StyleProp<ImageStyle | ViewStyle>;
  /**
   * Style for the placeholder (used for fadeIn)
   */
  placeholderStyle?: StyleProp<ImageStyle | ViewStyle>;
  /**
   * Called when there is an error
   */
  onError?: () => void;
  /**
   * This is set if we know that an image is remote
   */
  isUrl?: boolean;
  /**
   * Token address
   */
  address?: string;
  isTokenImage?: boolean;
  isFullRatio?: boolean;
  chainId?: string | number;
}

const RemoteImage = (props: RemoteImageProps) => {
  const [error, setError] = useState<string | undefined>(undefined);
  // Avoid using this component with animated SVG
  const source = Image.resolveAssetSource(
    props.source as ImageSourcePropType,
  ) as ImageResolvedAssetSource & { __packager_asset?: boolean };
  const sourceUri = (props.source as ImageURISource | undefined)?.uri;
  const isImageUrl = isUrl(sourceUri as string);
  const ipfsGateway = useIpfsGateway();
  const styles = createStyles();
  const currentChainId = useSelector(selectChainId);
  // The chainId would be passed in props from parent for collectible media
  //TODO remove once migrated to TS and chainID is properly typed to hex
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

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    resolveIpfsUrl();
    async function resolveIpfsUrl() {
      try {
        const url = new URL(sourceUri as string);
        if (url.protocol !== 'ipfs:') setResolvedIpfsUrl(false);
        const ipfsUrl = await getFormattedIpfsUrl(
          ipfsGateway,
          sourceUri as string,
          false,
        );
        setResolvedIpfsUrl(ipfsUrl);
      } catch (err) {
        setResolvedIpfsUrl(false);
      }
    }
  }, [sourceUri, ipfsGateway]);

  useEffect(() => {
    const calculateImageDimensions = (
      imageWidth: number,
      imageHeight: number,
    ) => {
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
    const customNetworkImg = CustomNetworkImgMapping[chainId as Hex];

    if (network) {
      return network.rpcPrefs.imageSource;
    } else if (customNetworkImg) {
      return customNetworkImg;
    }
    return undefined;
  }, [chainId]);

  const isSVG = Boolean(
    source &&
      source.uri?.match('.svg') &&
      (isImageUrl || resolvedIpfsUrl),
  );

  const viewbox = useSvgUriViewBox(uri, isSVG);

  if (error && props.address) {
    return (
      <Identicon
        address={props.address}
        customStyle={props.style as ImageStyle}
      />
    );
  }

  if (isSVG) {
    const style = (props.style || {}) as ImageStyle;
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
            {...(props as React.ComponentProps<typeof SvgUri>)}
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
                  <View style={style as StyleProp<ViewStyle>}>
                    <Image
                      style={styles.imageStyle}
                      {...restProps}
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
          <FadeIn placeholderStyle={props.placeholderStyle}>
            <Image {...(props as ImageProps)} source={{ uri }} onError={onError} />
          </FadeIn>
        )}
      </>
    );
  }

  return (
    <Image {...(props as ImageProps)} source={{ uri }} onError={onError} />
  );
};



export default RemoteImage;
