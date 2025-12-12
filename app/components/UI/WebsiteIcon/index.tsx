import React, { PureComponent } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { fontStyles } from '../../../styles/common';
import { getHost } from '../../../util/browser';
import { ThemeContext, mockTheme } from '../../../util/theme';
import withFaviconAwareness from '../../hooks/useFavicon/withFaviconAwareness';
import { isNumber } from 'lodash';
import { isFaviconSVG } from '../../../util/favicon';
import { SvgUri } from 'react-native-svg';
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

interface IconObject {
  uri?: string;
}

interface WebsiteIconProps {
  style?: ImageStyle;
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  title?: string;
  url: string;
  transparent?: boolean;
  icon?: string | IconObject;
  faviconSource?: string;
}

interface WebsiteIconState {
  renderIconUrlError: boolean;
}

/**
 * View that renders a website logo depending of the context
 */
/**
 * @deprecated This `<WebsiteIcon>` component has been deprecated, any new usage of it should use Avatar with the favicon variant instead:
 * https://github.com/MetaMask/metamask-mobile/blob/34f9da127435053a32e5f4e9c69ce8aa1e37c394/app/component-library/components/Avatars/Avatar/README.md#L1
 */
class WebsiteIcon extends PureComponent<WebsiteIconProps, WebsiteIconState> {
  declare context: React.ContextType<typeof ThemeContext>;

  state: WebsiteIconState = {
    renderIconUrlError: false,
  };

  /**
   * Sets component state to renderIconUrlError to render placeholder image
   */
  onRenderIconUrlError = async () => {
    await this.setState({ renderIconUrlError: true });
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
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    // apiLogoUrl is the url of the icon to be rendered, but it's populated
    // from the icon prop, if it exists, or from the faviconSource prop
    // that is provided by the withFaviconAwareness HOC for useFavicon hook.

    const apiLogoUrl: ImageSourcePropType = {
      uri: (typeof icon === 'string' ? icon : icon?.uri) || faviconSource,
    };

    let title = this.props.title;

    if (title !== undefined) {
      title =
        typeof this.props.title === 'string'
          ? this.props.title.substring(0, 1)
          : getHost(url || '').substring(0, 1);
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

    let imageSVG: string | undefined;

    if (
      apiLogoUrl &&
      !isNumber(apiLogoUrl) &&
      typeof apiLogoUrl === 'object' &&
      'uri' in apiLogoUrl
    ) {
      imageSVG = isFaviconSVG(apiLogoUrl);
    }

    const imageWidth = typeof style?.width === 'number' ? style.width : undefined;
    const imageHeight = typeof style?.height === 'number' ? style.height : undefined;

    return (
      <View style={viewStyle}>
        {imageSVG ? (
          <SvgUri
            uri={imageSVG}
            width={imageWidth}
            height={imageHeight}
            style={style}
            onError={this.onRenderIconUrlError}
          />
        ) : (
          <FadeIn
            placeholderStyle={{
              backgroundColor: transparent
                ? colors.transparent
                : colors.background.alternative,
            }}
          >
            <Image
              source={apiLogoUrl}
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
