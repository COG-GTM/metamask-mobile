import React, { PureComponent } from 'react';
import Modal from 'react-native-modal';
import { InteractionManager, StyleSheet, View, Image } from 'react-native';
import { connect } from 'react-redux';
import { hideCurrentNotification } from '../../../actions/notification';
import ElevatedView from 'react-native-elevated-view';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme } from '../../../util/theme/models';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    wrapper: {
      backgroundColor: colors.background.default,
      borderRadius: 8,
      marginHorizontal: 16,
    },
    contentWrapper: {
      paddingTop: 24,
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: Device.isIphoneX() ? 48 : 24,
    },
    title: {
      ...fontStyles.bold,
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 8,
      color: colors.text.default,
    },
    description: {
      ...fontStyles.normal,
      fontSize: 14,
      textAlign: 'center',
      color: colors.text.default,
    },
    content: {
      marginTop: 4,
      marginBottom: 4,
      textAlign: 'center',
    },
    clipboardIcon: {
      alignSelf: 'center',
      marginBottom: 16,
    },
    clipboardImage: {
      width: 60,
      height: 60,
    },
  });

interface NotificationContent {
  title?: string;
  description?: string;
}

interface GlobalAlertProps {
  isVisible: boolean;
  autodismiss: number | null;
  content: NotificationContent | null;
  data: {
    title?: string;
    msg?: string;
  } | null;
  hideCurrentNotification: () => void;
}

interface GlobalAlertState {
  isVisible: boolean;
}

class GlobalAlert extends PureComponent<GlobalAlertProps, GlobalAlertState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  state: GlobalAlertState = {
    isVisible: false,
  };

  animationTimerId: ReturnType<typeof setTimeout> | null = null;
  autoDismissTimerId: ReturnType<typeof setTimeout> | null = null;

  static defaultProps = {
    content: null,
    data: null,
  };

  componentDidUpdate(prevProps: GlobalAlertProps) {
    if (!prevProps.isVisible && this.props.isVisible) {
      this.animationTimerId = setTimeout(() => {
        this.setState({ isVisible: true });
      }, 100);

      if (this.props.autodismiss) {
        this.autoDismissTimerId = setTimeout(() => {
          this.props.hideCurrentNotification();
        }, this.props.autodismiss);
      }
    }

    if (prevProps.isVisible && !this.props.isVisible) {
      this.setState({ isVisible: false });
    }
  }

  componentWillUnmount() {
    if (this.animationTimerId) {
      clearTimeout(this.animationTimerId);
    }
    if (this.autoDismissTimerId) {
      clearTimeout(this.autoDismissTimerId);
    }
  }

  onHide = () => {
    InteractionManager.runAfterInteractions(() => {
      this.props.hideCurrentNotification();
    });
  };

  renderClipboardAlert() {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const clipboardIcon = require('../../../images/clipboard.png');

    return (
      <View style={styles.contentWrapper}>
        <View style={styles.clipboardIcon}>
          <Image source={clipboardIcon} style={styles.clipboardImage} />
        </View>
        <Text variant={TextVariant.HeadingMD} style={styles.title}>
          {strings('global_alert.clipboard_title')}
        </Text>
        <Text variant={TextVariant.BodyMD} style={styles.description}>
          {strings('global_alert.clipboard_description')}
        </Text>
      </View>
    );
  }

  render() {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const { content, data } = this.props;

    if (data) {
      return (
        <Modal
          isVisible={this.state.isVisible}
          onBackdropPress={this.onHide}
          onBackButtonPress={this.onHide}
          onSwipeComplete={this.onHide}
          swipeDirection="down"
          propagateSwipe
          backdropOpacity={0.7}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.modal}
        >
          {this.renderClipboardAlert()}
        </Modal>
      );
    }

    if (!content) return null;

    return (
      <Modal
        isVisible={this.state.isVisible}
        onBackdropPress={this.onHide}
        onBackButtonPress={this.onHide}
        onSwipeComplete={this.onHide}
        swipeDirection="down"
        propagateSwipe
        backdropOpacity={0.7}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <ElevatedView style={styles.wrapper} elevation={100}>
          <View style={styles.contentWrapper}>
            <Text variant={TextVariant.HeadingMD} style={styles.title}>
              {content.title}
            </Text>
            <Text variant={TextVariant.BodyMD} style={styles.description}>
              {content.description}
            </Text>
          </View>
        </ElevatedView>
      </Modal>
    );
  }
}

const mapStateToProps = (state: {
  notification: {
    isVisible: boolean;
    autodismiss: number | null;
    content: NotificationContent | null;
    data: {
      title?: string;
      msg?: string;
    } | null;
  };
}) => ({
  isVisible: state.notification.isVisible,
  autodismiss: state.notification.autodismiss,
  content: state.notification.content,
  data: state.notification.data,
});

const mapDispatchToProps = (dispatch: (action: { type: string }) => void) => ({
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
