import React, { PureComponent } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { fontStyles } from '../../../styles/common';
import { getHost } from '../../../util/browser';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';
import withFaviconAwareness from '../../hooks/useFavicon/withFaviconAwareness';
import { isNumber } from 'lodash';
import { isFaviconSVG } from '../../../util/favicon';
import { SvgUri } from 'react-native-svg';

const createStyles = (colors: Theme['colors']) =>
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

interface IconObject {
  uri?: string;
}

interface WebsiteIconProps {
  /**
   * Style object for image
   */
  style?: StyleProp<ImageStyle> & { width?: number; height?: number };
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
  icon?: string | IconObject;
  /**
   * Favicon source to use, this substitutes getting the icon from the url
   * This is populated by the withFaviconAwareness HOC
   */
  faviconSource?: string;
}

interface WebsiteIconState {
  renderIconUrlError: boolean;
}

/**
 * View that renders a website logo depending of the context
 */
class WebsiteIcon extends PureComponent<WebsiteIconProps, WebsiteIconState> {
  state: WebsiteIconState = {
    renderIconUrlError: false,
  };

  /**
   * Sets component state to renderIconUrlError to render placeholder image
   */
  onRenderIconUrlError = async () => {
    this.setState({ renderIconUrlError: true });
  };

  render = () => {
    const { renderIconUrlError } = this.state;
    const {
      viewStyle,
      style,
      textStyle,
      transparent,
      url,
      icon,
      faviconSource,
    } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const apiLogoUrl: { uri?: string } = {
      uri: (typeof icon === 'string' ? icon : icon?.uri) || faviconSource,
    };

    let title = this.props.title;

    if (title !== undefined) {
      title =
        typeof this.props.title === 'string'
          ? this.props.title.substring(0, 1)
          : getHost(url).substring(0, 1);
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

    let imageSVG: string | null | undefined;

    if (apiLogoUrl && !isNumber(apiLogoUrl) && 'uri' in apiLogoUrl) {
      imageSVG = isFaviconSVG(apiLogoUrl);
    }

    return (
      <View style={viewStyle}>
        {imageSVG ? (
          <SvgUri
            uri={imageSVG}
            width={style?.width}
            height={style?.height}
            style={style}
            onError={this.onRenderIconUrlError}
          />
        ) : (
          <FadeIn
            placeholderStyle={{
              backgroundColor: transparent
                ? colors.background.alternative
                : colors.background.alternative,
            }}
          >
            <Image
              source={apiLogoUrl as { uri: string }}
              style={style}
              onError={this.onRenderIconUrlError}
            />
          </FadeIn>
        )}
      </View>
    );
  };
}

WebsiteIcon.contextType = ThemeContext;

export default withFaviconAwareness(WebsiteIcon);
