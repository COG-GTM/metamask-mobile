import React, { PureComponent } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { dismissAlert } from '../../../actions/alert';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView from 'react-native-elevated-view';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      width: '100%',
    },
    copyAlert: {
      backgroundColor: colors.overlay.alternative,
      padding: 20,
      paddingTop: 30,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
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
  width?: number;
  msg?: string;
}

interface GlobalAlertStateProps {
  /**
   * Boolean that determines if the modal should be shown
   */
  isVisible: boolean;
  /**
   * Number that determines when it should be autodismissed (in miliseconds)
   */
  autodismiss?: number;
  /**
   * Children component(s)
   */
  content?: string;
  /**
   * Object with data required to render the content
   */
  data?: AlertData;
}

interface GlobalAlertDispatchProps {
  /**
   * function that dismisses de modal
   */
  dismissAlert: () => void;
}

type GlobalAlertProps = GlobalAlertStateProps & GlobalAlertDispatchProps;

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

  getComponent(content?: string) {
    switch (content) {
      case 'clipboard-alert':
        return this.renderClipboardAlert();
      default:
        return <View />;
    }
  }

  getStyles = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderClipboardAlert = () => {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = this.getStyles();

    return (
      <ElevatedView
        style={[styles.copyAlert, { width: this.props.data?.width || 180 }]}
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
          {this.props.data?.msg}
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

const mapStateToProps = (state: RootState): GlobalAlertStateProps => ({
  isVisible: state.alert.isVisible,
  autodismiss: state.alert.autodismiss,
  content: state.alert.content,
  data: state.alert.data,
});

const mapDispatchToProps = (
  dispatch: Dispatch,
): GlobalAlertDispatchProps => ({
  dismissAlert: () => dispatch(dismissAlert()),
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
