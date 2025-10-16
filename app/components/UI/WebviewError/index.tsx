import React, { PureComponent } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme } from '../../../util/theme/models';
import type { WebViewError } from '@metamask/react-native-webview/lib/WebViewTypes';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-commonjs
const errorImage = require('../../../images/error-boundary-bg.png');

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    modalView: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingTop: 24,
    },
    webview: {
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      flex: 1,
    },
    iconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: 50,
      height: 50,
    },
    title: {
      ...fontStyles.bold,
      fontSize: 16,
      color: colors.text.default,
      textAlign: 'center',
      paddingVertical: 8,
    },
    textContent: {
      paddingHorizontal: 24,
    },
    errorMessage: {
      ...fontStyles.normal,
      fontSize: 14,
      color: colors.text.default,
      textAlign: 'left',
      paddingVertical: 8,
    },
    button: {
      marginTop: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary.default,
      borderRadius: 50,
      padding: 12,
      paddingHorizontal: 34,
      marginHorizontal: 24,
    },
    cancel: {
      backgroundColor: colors.primary.default,
    },
    confirm: {
      backgroundColor: colors.background.default,
    },
    buttonText: {
      ...fontStyles.normal,
      fontSize: 14,
      textAlign: 'center',
    },
    cancelButtonText: {
      color: colors.primary.inverse,
    },
    confirmButtonText: {
      color: colors.primary.default,
    },
  });

interface WebviewErrorProps {
  error?: Error | boolean | WebViewError | null;
  returnHome: () => void;
  showDetails?: () => void;
}

export default class WebviewError extends PureComponent<WebviewErrorProps> {
  static contextType = ThemeContext;

  render() {
    const { error, returnHome, showDetails } = this.props;
    const colors = (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        isVisible={Boolean(error)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
        backdropOpacity={0.7}
        animationInTiming={600}
        animationOutTiming={600}
        onBackdropPress={returnHome}
        onBackButtonPress={returnHome}
        onSwipeComplete={returnHome}
        swipeDirection="down"
        propagateSwipe
      >
        <View style={styles.modalView}>
          <View style={styles.iconWrapper}>
            <Image source={errorImage} style={styles.image} />
          </View>
          <View style={styles.textContent}>
            <Text style={styles.title}>{strings('error_screen.title')}</Text>
            <Text style={styles.errorMessage}>
              {strings('error_screen.error_boundary_content')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.cancel]}
            onPress={returnHome}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              {strings('error_screen.error_boundary_return_home')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirm]}
            onPress={showDetails || (() => undefined)}
          >
            <Text style={[styles.buttonText, styles.confirmButtonText]}>
              {strings('error_screen.error_boundary_view_details')}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
}
