import React, { PureComponent } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { dismissAlert } from '../../../actions/alert';
import { connect, ConnectedProps } from 'react-redux';
import { Dispatch } from 'redux';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView from 'react-native-elevated-view';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

interface ClipboardAlertData {
  width?: number;
  msg?: string;
}

const createStyles = (colors: Colors) =>
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

const copyAlertStyle = (colors: Colors, width?: number) => ({
  width: width || 180,
  backgroundColor: colors.overlay.alternative,
  padding: 20,
  paddingTop: 30,
  alignSelf: 'center' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: 8,
});

interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: ClipboardAlertData | null;
}

const mapStateToProps = (state: RootState): AlertState => {
  const alertState = (state as RootState & { alert?: AlertState }).alert;
  return {
    isVisible: alertState?.isVisible ?? false,
    autodismiss: alertState?.autodismiss ?? null,
    content: alertState?.content ?? null,
    data: alertState?.data ?? null,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissAlert()),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

/**
 * Wrapper component for a global alert
 * connected to redux
 */
class GlobalAlert extends PureComponent<Props> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  onClose = () => {
    this.props.dismissAlert();
  };

  componentDidUpdate(prevProps: Props) {
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

  getComponent(content: string | null) {
    switch (content) {
      case 'clipboard-alert':
        return this.renderClipboardAlert();
      default:
        return <View />;
    }
  }

  getStyles = () => {
    const colors: Colors = this.context?.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderClipboardAlert = () => {
    const colors: Colors = this.context?.colors || mockTheme.colors;
    const styles = this.getStyles();

    return (
      <ElevatedView
        style={copyAlertStyle(colors, this.props.data?.width)}
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

  render() {
    const { content, isVisible } = this.props;
    const colors: Colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

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
  }
}

export default connector(GlobalAlert);
