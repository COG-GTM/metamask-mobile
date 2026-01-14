import React, { PureComponent, ReactNode } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { dismissAlert } from '../../../actions/alert';
import { connect } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView from 'react-native-elevated-view';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';
import { RootState } from '../../../reducers';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      width: '100%',
    },
    copyAlertIcon: {
      marginBottom: 20,
    },
    copyAlertText: {
      textAlign: 'center',
      color: colors.overlay.inverse,
      fontSize: 16,
      ...fontStyles.normal,
    },
  });

const createCopyAlertStyle = (colors: Theme['colors'], width?: number) => ({
  width: width || 180,
  backgroundColor: colors.overlay.alternative,
  padding: 20,
  paddingTop: 30,
  alignSelf: 'center' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: 8,
});

interface AlertData {
  width?: number;
  msg?: string;
}

interface GlobalAlertProps {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: AlertData;
  dismissAlert: () => void;
}

/**
 * Wrapper component for a global alert
 * connected to redux
 */
class GlobalAlert extends PureComponent<GlobalAlertProps> {
  static contextType = ThemeContext;

  onClose = () => {
    this.props.dismissAlert();
  };

  componentDidUpdate(prevProps: GlobalAlertProps) {
    if (
      this.props.autodismiss &&
      !isNaN(this.props.autodismiss) &&
      !prevProps.isVisible &&
      this.props.isVisible
    ) {
      setTimeout(() => {
        this.props.dismissAlert();
      }, this.props.autodismiss);
    }
  }

  getComponent(content?: string): ReactNode {
    switch (content) {
      case 'clipboard-alert':
        return this.renderClipboardAlert();
      default:
        return <View />;
    }
  }

  getStyles = () => {
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderClipboardAlert = () => {
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    const styles = this.getStyles();
    const copyAlertStyle = createCopyAlertStyle(
      colors,
      this.props.data?.width,
    );

    return (
      <ElevatedView style={copyAlertStyle} elevation={5}>
        <View style={styles.copyAlertIcon}>
          <Icon
            name={'check-circle'}
            size={64}
            color={colors.overlay.inverse}
          />
        </View>
        <Text style={styles.copyAlertText}>
          {this.props.data && this.props.data.msg}
        </Text>
      </ElevatedView>
    );
  };

  render = () => {
    const { content, isVisible } = this.props;
    const styles = this.getStyles();

    return (
      <Modal
        style={styles.modal}
        isVisible={isVisible}
        onBackdropPress={this.onClose}
        onBackButtonPress={this.onClose}
        backdropOpacity={0}
        animationIn={'fadeIn'}
        animationOut={'fadeOut'}
        useNativeDriver
      >
        {this.getComponent(content)}
      </Modal>
    );
  };
}

const mapStateToProps = (state: RootState) => ({
  isVisible: state.alert.isVisible,
  autodismiss: state.alert.autodismiss,
  content: state.alert.content,
  data: state.alert.data,
});

const mapDispatchToProps = {
  dismissAlert,
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
