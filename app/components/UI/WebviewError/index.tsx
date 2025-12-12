import React, { PureComponent } from 'react';
import { Image, StyleSheet, View, Text, Platform } from 'react-native';
import StyledButton from '../StyledButton';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
import generateTestId from '../../../../wdio/utils/generateTestId';
import {
  ERROR_PAGE_MESSAGE,
  ERROR_PAGE_RETURN_BUTTON,
  ERROR_PAGE_TITLE,
} from '../../../../wdio/screen-objects/testIDs/BrowserScreen/ExternalWebsites.testIds';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999999999999,
    },
    foxWrapper: {
      backgroundColor: colors.background.default,
      marginTop: -100,
      width: 110,
      marginBottom: 20,
      height: 110,
    },
    textWrapper: {
      width: 300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      alignSelf: 'center',
      width: 110,
      height: 110,
    },
    errorTitle: {
      color: colors.text.default,
      ...fontStyles.bold,
      fontSize: 18,
      marginBottom: 15,
    },
    errorMessage: {
      textAlign: 'center',
      color: colors.text.alternative,
      ...fontStyles.normal,
      fontSize: 14,
      marginBottom: 10,
    },
    errorInfo: {
      color: colors.text.muted,
      ...fontStyles.normal,
      fontSize: 12,
    },
    buttonWrapper: {
      width: 200,
      marginTop: 30,
    },
  });

interface WebviewErrorInfo {
  description?: string;
}

interface WebviewErrorProps {
  error?: WebviewErrorInfo | boolean;
  returnHome?: () => void;
}

/**
 * View that renders custom error page for the browser
 */
export default class WebviewError extends PureComponent<WebviewErrorProps> {
  static defaultProps = {
    error: false,
  };

  // Initialize context with mockTheme to satisfy TypeScript (avoids 'declare' which Babel doesn't support)
  context: React.ContextType<typeof ThemeContext> = mockTheme;

  returnHome = () => {
    this.props.returnHome?.();
  };

  render() {
    const { error } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const errorInfo = typeof error === 'object' ? error : null;

    return error ? (
      <View style={styles.wrapper}>
        <View style={styles.foxWrapper}>
          <Image
            source={require('../../../images/branding/fox.png')}
            style={styles.image}
            resizeMethod={'auto'}
          />
        </View>
        <View style={styles.textWrapper}>
          <Text
            style={styles.errorTitle}
            {...generateTestId(Platform, ERROR_PAGE_TITLE)}
          >
            {strings('webview_error.title')}
          </Text>
          <Text
            style={styles.errorMessage}
            {...generateTestId(Platform, ERROR_PAGE_MESSAGE)}
          >
            {strings('webview_error.message')}
          </Text>
          {errorInfo?.description ? (
            <Text style={styles.errorInfo}>{errorInfo.description}</Text>
          ) : null}
        </View>
        <View
          style={styles.buttonWrapper}
          {...generateTestId(Platform, ERROR_PAGE_RETURN_BUTTON)}
        >
          <StyledButton type={'confirm'} onPress={this.returnHome}>
            {strings('webview_error.return_home')}
          </StyledButton>
        </View>
      </View>
    ) : null;
  }
}

WebviewError.contextType = ThemeContext;
