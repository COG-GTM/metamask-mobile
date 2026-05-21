import React, { PureComponent } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { dismissAlert } from '../../../actions/alert';
import { connect } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView from 'react-native-elevated-view';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface ThemeColors {
  overlay: { alternative: string; inverse: string };
}

const createStyles = (colors: ThemeColors) =>
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

interface AlertData {
  msg?: string;
  width?: number;
}

interface GlobalAlertProps {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: AlertData;
  dismissAlert: () => void;
}

class GlobalAlert extends PureComponent<GlobalAlertProps> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  onClose = (): void => {
    this.props.dismissAlert();
  };

  componentDidUpdate(prevProps: GlobalAlertProps): void {
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

  getComponent(content: string | undefined): React.ReactNode {
    switch (content) {
      case 'clipboard-alert':
        return this.renderClipboardAlert();
      default:
        return <View />;
    }
  }

  getStyles = () => {
    const colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderClipboardAlert = (): React.ReactNode => {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = this.getStyles();

    return (
      <ElevatedView
        style={{
          width: (this.props.data && this.props.data.width) || 180,
          backgroundColor: colors.overlay.alternative,
          padding: 20,
          paddingTop: 30,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
        elevation={5}
      >
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

  render = (): React.ReactNode => {
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

interface RootState {
  alert: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: AlertData;
  };
}

const mapStateToProps = (state: RootState) => ({
  isVisible: state.alert.isVisible,
  autodismiss: state.alert.autodismiss,
  content: state.alert.content,
  data: state.alert.data,
});

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  dismissAlert: () => dispatch(dismissAlert()),
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
