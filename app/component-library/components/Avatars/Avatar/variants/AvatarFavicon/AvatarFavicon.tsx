/* eslint-disable react/prop-types */

// Third party dependencies.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import { SvgUri, SvgXml } from 'react-native-svg';

// External dependencies.
import { useStyles } from '../../../../../hooks';
import Icon from '../../../../Icons/Icon';
import { ICONSIZE_BY_AVATARSIZE } from '../../Avatar.constants';
import AvatarBase from '../../foundation/AvatarBase';

// Internal dependencies.
import { isFaviconSVG } from '../../../../../../util/favicon';
import {
  AVATARFAVICON_IMAGE_TESTID,
  AVATARFAVICON_IMAGE_SVG_TESTID,
  DEFAULT_AVATARFAVICON_ERROR_ICON,
  DEFAULT_AVATARFAVICON_SIZE,
} from './AvatarFavicon.constants';
import stylesheet from './AvatarFavicon.styles';
import { AvatarFaviconProps } from './AvatarFavicon.types';

const SVG_UTF8_DATA_URI_PREFIX = 'data:image/svg+xml;utf8,';

const decodeSvgDataUri = (uri: string): string | undefined => {
  try {
    return decodeURIComponent(uri.slice(SVG_UTF8_DATA_URI_PREFIX.length));
  } catch (_) {
    return undefined;
  }
};

const AvatarFavicon = ({
  imageSource,
  size = DEFAULT_AVATARFAVICON_SIZE,
  style,
  ...props
}: AvatarFaviconProps) => {
  const isRequireSource = !!(imageSource && typeof imageSource === 'number');
  const isRemoteSource = !!(
    imageSource &&
    typeof imageSource === 'object' &&
    'uri' in imageSource
  );
  const isValidSource = isRequireSource || isRemoteSource;
  const [imageError, setImageError] = useState<Error | undefined>(undefined);
  const [svgError, setSvgError] = useState<Error | undefined>(undefined);
  const [svgSource, setSvgSource] = useState<string>('');
  const { styles } = useStyles(stylesheet, { style });

  const onError = useCallback(
    (e: NativeSyntheticEvent<ImageErrorEventData>) =>
      setImageError(e.nativeEvent?.error),
    [setImageError],
  );

  const onSvgError = useCallback((e: Error) => setSvgError(e), [setSvgError]);

  // TODO add the fallback with uppercase letter initial
  //  requires that the domain is passed in as a prop from the parent
  const renderFallbackFavicon = () => (
    <Icon
      size={ICONSIZE_BY_AVATARSIZE[size]}
      name={DEFAULT_AVATARFAVICON_ERROR_ICON}
    />
  );

  // Checks if image is SVG
  useEffect(() => {
    if (!isRemoteSource) return;

    const checkSvgContentType = async (uri: string) => {
      try {
        // Skip header check for data URIs
        if (uri.startsWith('data:image/svg+xml')) {
          return true;
        }
        const response = await fetch(uri, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type');
        return contentType?.includes('image/svg+xml');
      } catch (_) {
        return false;
      }
    };

    const svg = isFaviconSVG(imageSource);
    if (svg) {
      checkSvgContentType(svg).then((isSvg) => {
        if (isSvg) {
          setSvgSource(svg);
        }
      });
    }
  }, [imageSource, isRemoteSource]);

  const isSvgDataUri = svgSource.startsWith(SVG_UTF8_DATA_URI_PREFIX);
  const svgDataUriXml = useMemo(
    () => (isSvgDataUri ? decodeSvgDataUri(svgSource) : undefined),
    [isSvgDataUri, svgSource],
  );
  const svgDataUriError = useMemo(
    () =>
      isSvgDataUri && svgDataUriXml === undefined
        ? new Error('Malformed SVG data URI')
        : undefined,
    [isSvgDataUri, svgDataUriXml],
  );

  const renderSvg = () => {
    if (!svgSource) {
      return null;
    }

    // SvgUri does not work on Android with data URIs, so instead we use SvgXml
    if (isSvgDataUri) {
      if (svgDataUriXml === undefined) {
        return renderFallbackFavicon();
      }
      return (
        <SvgXml
          testID={AVATARFAVICON_IMAGE_SVG_TESTID}
          width="100%"
          height="100%"
          xml={svgDataUriXml}
          style={styles.image}
          onError={(e: unknown) => onSvgError(e as Error)}
        />
      );
    }

    return (
      <SvgUri
        testID={AVATARFAVICON_IMAGE_SVG_TESTID}
        width="100%"
        height="100%"
        uri={svgSource}
        style={styles.image}
        onError={(e: unknown) => onSvgError(e as Error)}
      />
    );
  };

  const renderImage = () => (
    <Image
      testID={AVATARFAVICON_IMAGE_TESTID}
      source={imageSource}
      style={styles.image}
      resizeMode={'contain'}
      onError={onError}
    />
  );

  const renderFavicon = () => (svgSource ? renderSvg() : renderImage());

  const error = svgSource ? svgDataUriError || svgError : imageError;

  return (
    <AvatarBase size={size} style={styles.base} {...props}>
      {error || !isValidSource ? renderFallbackFavicon() : renderFavicon()}
    </AvatarBase>
  );
};

export default AvatarFavicon;
