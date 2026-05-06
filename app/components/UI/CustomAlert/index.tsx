import React, { ReactElement, ReactNode, PureComponent } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Modal from 'react-native-modal';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
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
    } as TextStyle,
    footer: {
      padding: 20,
      paddingTop: 10,
    },
  });

interface Props {
  /**
   * Style of the header view
   */
  headerStyle?: StyleProp<ViewStyle>;
  /**
   * Content to be displayed in the header
   */
  headerContent?: ReactNode;
  /**
   * Text of the title
   */
  titleText?: string;
  /**
   * Component that contains the content of the modal
   */
  bodyContent?: ReactElement;
  /**
   * Text of the button
   */
  buttonText?: string;
  /**
   * Action of the button
   */
  onPress?: () => void;
  /**
   * Boolean that controls the modal visibility
   */
  isVisible?: boolean;
  /**
   * Function that will be called when tapping on the backdrop
   */
  onBackdropPress?: () => void;
  /**
   * Function that will be called when swiping on swipeDirection
   */
  onSwipeComplete?: () => void;
  /**
   * Direction of the swipe gesture to trigger a swipeComplete event
   */
  swipeDirection?: string;
  /**
   * Children components
   */
  children?: ReactNode;
}

/**
 * PureComponent that renders our custom alerts, which contains
 * a header with an image, body and footer with a button
 */
export default class CustomAlert extends PureComponent<Props> {
  static contextType = ThemeContext;

  render() {
    const colors =
      (this.context as { colors?: Colors } | undefined)?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors);

    const {
      headerStyle: _headerStyle,
      headerContent: _headerContent,
      titleText: _titleText,
      bodyContent: _bodyContent,
      buttonText: _buttonText,
      onPress,
      children: _children,
      swipeDirection,
      ...modalProps
    } = this.props;

    type ModalDirection = 'up' | 'down' | 'left' | 'right';

    return (
      <Modal
        style={styles.modal}
        onBackButtonPress={onPress}
        {...modalProps}
        swipeDirection={swipeDirection as ModalDirection | undefined}
        isVisible={this.props.isVisible ?? false}
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
      >
        <View style={styles.content}>
          <View style={[styles.header, this.props.headerStyle]}>
            {this.props.headerContent}
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{this.props.titleText}</Text>
            {this.props.children}
          </View>
          <View style={styles.footer}>
            <StyledButton type={'confirm'} onPress={this.props.onPress}>
              {this.props.buttonText}
            </StyledButton>
          </View>
        </View>
      </Modal>
    );
  }
}
