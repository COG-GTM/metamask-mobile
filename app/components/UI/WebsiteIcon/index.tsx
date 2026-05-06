import React, { PureComponent } from 'react';
import { StyleSheet, View, Text, Image, ImageStyle, TextStyle, ViewStyle, StyleProp } from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { fontStyles } from '../../../styles/common';
import { getHost } from '../../../util/browser';
import { ThemeContext, mockTheme } from '../../../util/theme';
import withFaviconAwareness from '../../hooks/useFavicon/withFaviconAwareness';
import { isNumber } from 'lodash';
import { isFaviconSVG } from '../../../util/favicon';
import { SvgUri } from 'react-native-svg';
import { Theme } from '../../../util/theme/models';

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

interface Props {
  style?: StyleProp<ImageStyle> & { width?: number; height?: number };
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  title?: string;
  url: string;
  transparent?: boolean;
  icon?: string | IconObject;
  faviconSource?: string;
}

interface State {
  renderIconUrlError: boolean;
}

/**
 * @deprecated This `<WebsiteIcon>` component has been deprecated, any new usage of it should use Avatar with the favicon variant instead.
 */
class WebsiteIcon extends PureComponent<Props, State> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: State = {
    renderIconUrlError: false,
  };

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

    const apiLogoUrl = {
      uri: (typeof icon === 'string' ? icon : (icon as IconObject)?.uri) || faviconSource,
    };

    let title = this.props.title;

    if (title !== undefined) {
      title =
        typeof this.props.title === 'string'
          ? this.props.title.substring(0, 1)
          : getHost(url ?? '').substring(0, 1);
    }

    if (title && (!apiLogoUrl?.uri || renderIconUrlError)) {
      return (
        <View style={viewStyle}>
          <View style={[styles.fallback, style as StyleProp<ViewStyle>]}>
            <Text style={[styles.fallbackText, textStyle]}>{title}</Text>
          </View>
        </View>
      );
    }

    let imageSVG: string | undefined;

    if (apiLogoUrl && !isNumber(apiLogoUrl) && 'uri' in apiLogoUrl) {
      imageSVG = isFaviconSVG(apiLogoUrl) as string | undefined;
    }

    const imgStyle = style as { width?: number; height?: number };

    return (
      <View style={viewStyle}>
        {imageSVG ? (
          <SvgUri
            uri={imageSVG}
            width={imgStyle?.width}
            height={imgStyle?.height}
            style={style as StyleProp<ViewStyle>}
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

export default withFaviconAwareness(WebsiteIcon);
