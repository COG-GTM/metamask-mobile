import React, { ComponentClass, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageStyle,
  ImageURISource,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { fontStyles } from '../../../styles/common';
import { getHost } from '../../../util/browser';
import { useTheme } from '../../../util/theme';
import withFaviconAwareness from '../../hooks/useFavicon/withFaviconAwareness';
import { isNumber } from 'lodash';
import { isFaviconSVG } from '../../../util/favicon';
import { NumberProp, SvgUri } from 'react-native-svg';
import { Colors } from '../../../util/theme/models';

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

interface Props {
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
  icon?: string | ImageURISource;
  /**
   * Favicon source to use, this substitutes getting the icon from the url
   * This is populated by the withFaviconAwareness HOC
   */
  faviconSource?: string;
}

/**
 * View that renders a website logo depending of the context
 */
/**
 * @deprecated This `<WebsiteIcon>` component has been deprecated, any new usage of it should use Avatar with the favicon variant instead:
 * https://github.com/MetaMask/metamask-mobile/blob/34f9da127435053a32e5f4e9c69ce8aa1e37c394/app/component-library/components/Avatars/Avatar/README.md#L1
 */
const WebsiteIcon = ({
  viewStyle,
  style,
  textStyle,
  transparent,
  url,
  icon,
  faviconSource,
  title: titleProp,
}: Props) => {
  const [renderIconUrlError, setRenderIconUrlError] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  /**
   * Sets component state to renderIconUrlError to render placeholder image
   */
  const onRenderIconUrlError = () => {
    setRenderIconUrlError(true);
  };

  // apiLogoUrl is the url of the icon to be rendered, but it's populated
  // from the icon prop, if it exists, or from the faviconSource prop
  // that is provided by the withFaviconAwareness HOC for useFavicon hook.

  const apiLogoUrl: ImageURISource = {
    uri: (typeof icon === 'string' ? icon : icon?.uri) || faviconSource,
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

  return (
    <View style={viewStyle}>
      {imageSVG ? (
        <SvgUri
          uri={imageSVG}
          width={style?.width as NumberProp | undefined}
          height={style?.height as NumberProp | undefined}
          style={style}
          onError={onRenderIconUrlError}
        />
      ) : (
        <FadeIn
          placeholderStyle={{
            backgroundColor: transparent
              ? // @ts-expect-error - `transparent` is not part of ThemeColors; resolves to undefined at runtime
                colors.transparent
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

export default withFaviconAwareness(
  WebsiteIcon as unknown as ComponentClass<{ url: string }>,
);
