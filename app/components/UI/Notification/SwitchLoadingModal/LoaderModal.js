import React from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from '../../../../util/theme';







const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: 'flex-end',
    marginHorizontal: 0
  }
});

const LoaderModal = (props) => {
  const { colors } = useTheme();

  return (
    <Modal
      isVisible={props.isVisible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.bottomModal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
      animationInTiming={600}
      animationOutTiming={600}
      onBackdropPress={props.onCancel}
      onSwipeComplete={props.onCancel}
      swipeDirection={'down'}
      propagateSwipe>
      
      {props.children}
    </Modal>);

};

export default LoaderModal;