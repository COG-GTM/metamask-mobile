import React, { ComponentClass, useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { fontStyles } from '../../../styles/common';
import { getHost } from '../../../util/browser';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import withFaviconAwareness from '../../hooks/useFavicon/withFaviconAwareness';
import { isNumber } from 'lodash';
import { isFaviconSVG } from '../../../util/favicon';
import { SvgUri } from 'react-native-svg';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    fallback: {
      alignContent: 'center',
      backgroundColor: colors.background.default,
      borderRadius: 27,
      height: 54,
      justifyContent: 'center',
      width: 54,
    },
    fallbackText: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 24,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });

/**
 * View that renders a website logo depending of the context
 */
/**
 * @deprecated This `<WebsiteIcon>` component has been deprecated, any new usage of it should use Avatar with the favicon variant instead:
 * https://github.com/MetaMask/metamask-mobile/blob/34f9da127435053a32e5f4e9c69ce8aa1e37c394/app/component-library/components/Avatars/Avatar/README.md#L1
 */
interface WebsiteIconProps {
  /**
   * Style object for image
   */
  style?: ImageStyle;
  /**
   * Style object for main view
   */
  viewStyle?: StyleProp<ViewStyle>;
  /**
   * Style object for text in case url not found
   */
  textStyle?: StyleProp<TextStyle>;
  /**
   * String corresponding to website title
   */
  title?: string;
  /**
   * String corresponding to website url
   */
  url?: string;
  /**
   * Flag that determines if the background
   * should be transaparent or not
   */
  transparent?: boolean;
  /**
   * Icon image to use, this substitutes getting the icon from the url
   */
  icon?: string | { uri?: string };

  /**
   * Favicon source to use, this substitutes getting the icon from the url
   * This is populated by the withFaviconAwareness HOC
   */
  faviconSource?: string;
}

const WebsiteIcon = ({
  viewStyle,
  style,
  textStyle,
  title: titleProp,
  transparent,
  url,
  icon,
  faviconSource,
}: WebsiteIconProps) => {
  const [renderIconUrlError, setRenderIconUrlError] =
    useState<boolean>(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  // apiLogoUrl is the url of the icon to be rendered, but it's populated
  // from the icon prop, if it exists, or from the faviconSource prop
  // that is provided by the withFaviconAwareness HOC for useFavicon hook.

  const apiLogoUrl = {
    uri: (typeof icon === 'string' ? icon : icon?.uri) || faviconSource,
  };

  /**
   * Sets component state to renderIconUrlError to render placeholder image
   */
  const onRenderIconUrlError = () => {
    setRenderIconUrlError(true);
  };

  let title = titleProp;

  if (title !== undefined) {
    title =
      typeof titleProp === 'string'
        ? titleProp.substring(0, 1)
        : getHost(url ?? '').substring(0, 1);
  }

  if (title && (!apiLogoUrl?.uri || renderIconUrlError)) {
    return (
      <View style={viewStyle}>
        <View style={[styles.fallback, style]}>
          <Text style={[styles.fallbackText, textStyle]}>{title}</Text>
        </View>
      </View>
    );
  }

  let imageSVG;

  if (apiLogoUrl && !isNumber(apiLogoUrl) && 'uri' in apiLogoUrl) {
    imageSVG = isFaviconSVG(apiLogoUrl);
  }

  const svgWidth =
    typeof style?.width === 'number' || typeof style?.width === 'string'
      ? style.width
      : undefined;
  const svgHeight =
    typeof style?.height === 'number' || typeof style?.height === 'string'
      ? style.height
      : undefined;

  return (
    <View style={viewStyle}>
      {imageSVG ? (
        <SvgUri
          uri={imageSVG}
          width={svgWidth}
          height={svgHeight}
          style={style}
          onError={onRenderIconUrlError}
        />
      ) : (
        <FadeIn
          placeholderStyle={{
            backgroundColor: transparent
              ? (colors as Colors & { transparent: string }).transparent
              : colors.background.alternative,
          }}
        >
          <Image
            source={apiLogoUrl}
            style={style}
            onError={onRenderIconUrlError}
          />
        </FadeIn>
      )}
    </View>
  );
};

// The legacy HOC typing only accepts class components.
export default withFaviconAwareness(
  WebsiteIcon as unknown as ComponentClass<{ url: string }>,
);
