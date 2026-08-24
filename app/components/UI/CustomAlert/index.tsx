import React, { PureComponent } from 'react';
import { StyleProp, StyleSheet, View, Text, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import { Theme } from '../../../util/theme/models';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

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

interface CustomAlertProps {
  /**
  /* Style of the header view
  */
  headerStyle?: StyleProp<ViewStyle>;
  /**
  /* Content to be displayed in the header
  */
  headerContent?: React.ReactNode;
  /**
  /* Text of the tile
  */
  titleText?: string;
  /**
  /* PureComponent that contains the content of the modal
  */
  bodyContent?: React.ReactElement;
  /**
  /* Text of the button
  */
  buttonText?: string;
  /**
  /* Action of the button
  */
  onPress?: () => void;
  /**
  /* Boolean that controls the modal visibility
  */
  isVisible?: boolean;
  /**
  /* Function that will be called when tapping on the backdrop
  */
  onBackdropPress?: () => void;
  /**
  /* Function that will be called when swiping on swipeDirection
  */
  onSwipeComplete?: () => void;
  /**
  /* Direction of the swipe gesture to trigger a swipeComplete event
  */
  swipeDirection?: 'up' | 'down' | 'left' | 'right';
  /**
  /* Children components
  */
  children?: React.ReactNode;
}

/**
/* PureComponent that renders our custom alerts, which contains
/* a header with an image, body and footer with a button
*/
export default class CustomAlert extends PureComponent<CustomAlertProps> {
  render() {
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        style={styles.modal}
        isVisible={(this as { propTypes?: boolean }).propTypes}
        onBackButtonPress={this.props.onPress}
        {...this.props}
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

CustomAlert.contextType = ThemeContext;
