import React, { PureComponent, ReactNode } from 'react';
import { StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

interface CustomAlertProps {
  headerStyle?: StyleProp<ViewStyle>;
  headerContent?: ReactNode;
  titleText?: string;
  bodyContent?: ReactNode;
  buttonText?: string;
  onPress?: () => void;
  isVisible?: boolean;
  onBackdropPress?: () => void;
  onSwipeComplete?: () => void;
  swipeDirection?: string;
  children?: ReactNode;
}

const createStyles = (colors: Theme['colors']) =>
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

/**
 * PureComponent that renders our custom alerts, which contains
 * a header with an image, body and footer with a button
 */
export default class CustomAlert extends PureComponent<CustomAlertProps> {
  static contextType = ThemeContext;

  render() {
    const colors = (this.context as { colors: Theme['colors'] }).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        style={styles.modal}
        isVisible={this.props.isVisible}
        onBackButtonPress={this.props.onPress}
        onBackdropPress={this.props.onBackdropPress}
        onSwipeComplete={this.props.onSwipeComplete}
        swipeDirection={this.props.swipeDirection as 'up' | 'down' | 'left' | 'right' | undefined}
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
