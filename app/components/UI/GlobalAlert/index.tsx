import React, { useCallback, useEffect, useRef } from 'react';
import Modal from 'react-native-modal';
import { StyleSheet, View, Text } from 'react-native';
import { connect } from 'react-redux';
import { dismissAlert } from '../../../actions/alert';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/FontAwesome';
import ElevatedView from 'react-native-elevated-view';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const createStyles = (colors: Colors) => ({
  ...StyleSheet.create({
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
  }),
  copyAlert: (width?: number) => ({
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

interface AlertData {
  width?: number;
  msg?: string;
}

interface StateProps {
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

interface DispatchProps {
  /**
   * function that dismisses de modal
   */
  dismissAlert: () => void;
}

type Props = StateProps & DispatchProps;

/**
 * Wrapper component for a global alert
 * connected to redux
 */
const GlobalAlert = ({
  isVisible,
  autodismiss,
  content,
  data,
  dismissAlert: dismissAlertAction,
}: Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const prevIsVisible = useRef(isVisible);

  const onClose = useCallback(() => {
    dismissAlertAction();
  }, [dismissAlertAction]);

  useEffect(() => {
    if (
      autodismiss &&
      !isNaN(autodismiss) &&
      !prevIsVisible.current &&
      isVisible
    ) {
      setTimeout(() => {
        dismissAlertAction();
      }, autodismiss);
    }
    prevIsVisible.current = isVisible;
  }, [autodismiss, isVisible, dismissAlertAction]);

  const renderClipboardAlert = () => (
    <ElevatedView style={styles.copyAlert(data?.width)} elevation={5}>
      <View style={styles.copyAlertIcon}>
        <Icon name={'check-circle'} size={64} color={colors.overlay.inverse} />
      </View>
      <Text style={styles.copyAlertText}>{data?.msg}</Text>
    </ElevatedView>
  );

  const getComponent = (alertContent?: string) => {
    switch (alertContent) {
      case 'clipboard-alert':
        return renderClipboardAlert();
      default:
        return <View />;
    }
  };

  return (
    <Modal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0}
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      useNativeDriver
    >
      {getComponent(content)}
    </Modal>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  isVisible: state.alert.isVisible,
  autodismiss: state.alert.autodismiss,
  content: state.alert.content,
  data: state.alert.data,
});

const mapDispatchToProps = (
  dispatch: (action: ReturnType<typeof dismissAlert>) => void,
): DispatchProps => ({
  dismissAlert: () => dispatch(dismissAlert()),
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalAlert);
