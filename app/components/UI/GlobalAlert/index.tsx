import React, { PureComponent } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { Dispatch } from 'redux';
import { dismissAlert } from '../../../actions/alert';
import { connect } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView, {
  ElevatedViewProperties,
} from 'react-native-elevated-view';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { RootState } from '../../../reducers';
import type { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) => ({
  ...StyleSheet.create({
    modal: {
      margin: 0,
      width: '100%' as const,
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
  }),
  copyAlert: (width?: number): ElevatedViewProperties['style'] => ({
    width: width || 180,
    backgroundColor: colors.overlay.alternative,
    padding: 20,
    paddingTop: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  }),
});

/**
 * Wrapper component for a global alert
 * connected to redux
 */
interface StateProps {
  /**
   * Boolean that determines if the modal should be shown
   */
  isVisible: boolean;
  /**
   * Number that determines when it should be autodismissed (in miliseconds)
   */
  autodismiss: number | null;
  /**
   * Children component(s)
   */
  content: string | null;
  /**
   * Object with data required to render the content
   */
  data: { width?: number; msg?: string } | null;
}

interface DispatchProps {
  /**
   * function that dismisses de modal
   */
  dismissAlert: () => void;
}

type Props = StateProps & DispatchProps;

class GlobalAlert extends PureComponent<Props> {
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
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  renderClipboardAlert = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = this.getStyles();

    return (
      <ElevatedView
        style={styles.copyAlert(this.props.data?.width)}
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

const mapStateToProps = (state: RootState): StateProps => ({
  isVisible: state.alert.isVisible,
  autodismiss: state.alert.autodismiss,
  content: state.alert.content,
  data: state.alert.data as StateProps['data'],
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  dismissAlert: () => dispatch(dismissAlert()),
});

GlobalAlert.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
