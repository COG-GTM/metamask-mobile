import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Modal, { ModalProps } from 'react-native-modal';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modal: {
      padding: 20,
    },
    content: {
      backgroundColor: colors.background.default,
      borderRadius: 16,
    },
    header: {
      paddingVertical: 15,
      height: 130,
      alignItems: 'center',
      borderTopEndRadius: 16,
      borderTopLeftRadius: 16,
    },
    body: {
      paddingVertical: 20,
      paddingHorizontal: 35,
    },
    title: {
      textAlign: 'center',
      fontSize: 16,
      ...fontStyles.bold,
      marginBottom: 15,
    },
    footer: {
      padding: 20,
      paddingTop: 10,
    },
  });

interface CustomAlertProps extends Partial<ModalProps> {
  /**
   * Style of the header view
   */
  headerStyle?: StyleProp<ViewStyle>;
  /**
   * Content to be displayed in the header
   */
  headerContent?: React.ReactNode;
  /**
   * Text of the title
   */
  titleText?: string;
  /**
   * Component that contains the content of the modal
   */
  bodyContent?: React.ReactElement;
  /**
   * Text of the button
   */
  buttonText?: string;
  /**
   * Action of the button
   */
  onPress?: () => void;
  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * Component that renders our custom alerts, which contains
 * a header with an image, body and footer with a button
 */
const CustomAlert = (props: CustomAlertProps) => {
  const { headerStyle, headerContent, titleText, buttonText, onPress } = props;
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal
      style={styles.modal}
      onBackButtonPress={onPress}
      {...props}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
    >
      <View style={styles.content}>
        <View style={[styles.header, headerStyle]}>{headerContent}</View>
        <View style={styles.body}>
          <Text style={styles.title}>{titleText}</Text>
          {props.children}
        </View>
        <View style={styles.footer}>
          <StyledButton type={'confirm'} onPress={onPress}>
            {buttonText}
          </StyledButton>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
