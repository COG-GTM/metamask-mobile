import React, { PureComponent } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
// @ts-expect-error -- legacy JavaScript UI type boundary
import { ViewPropTypes } from 'deprecated-react-native-prop-types';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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
/* PureComponent that renders our custom alerts, which contains
/* a header with an image, body and footer with a button
*/
interface CustomAlertProps {
  headerContent?: any;
  titleText?: string;
  bodyContent?: React.ReactElement;
  buttonText?: string;
  onPress?: (...args: any[]) => any;
  isVisible?: boolean;
  onBackdropPress?: (...args: any[]) => any;
  onSwipeComplete?: (...args: any[]) => any;
  swipeDirection?: string;
  children?: any;
}

export default class CustomAlert extends PureComponent<CustomAlertProps> {
  static propTypes = {
    /**
    /* Style of the header view
    */
    headerStyle: ViewPropTypes.style,
    /**
    /* Content to be displayed in the header
    */
    headerContent: PropTypes.any,
    /**
    /* Text of the tile
    */
    titleText: PropTypes.string,
    /**
    /* PureComponent that contains the content of the modal
    */
    bodyContent: PropTypes.element,
    /**
    /* Text of the button
    */
    buttonText: PropTypes.string,
    /**
    /* Action of the button
    */
    onPress: PropTypes.func,
    /**
    /* Boolean that controls the modal visibility
    */
    isVisible: PropTypes.bool,
    /**
    /* Function that will be called when tapping on the backdrop
    */
    onBackdropPress: PropTypes.func,
    /**
    /* Function that will be called when swiping on swipeDirection
    */
    onSwipeComplete: PropTypes.func,
    /**
    /* Direction of the swipe gesture to trigger a swipeComplete event
    */
    swipeDirection: PropTypes.string,
    /**
    /* Children components
    */
    children: PropTypes.any,
  };

  render() {
// @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
// @ts-expect-error -- legacy JavaScript UI type boundary
      <Modal
        style={styles.modal}
// @ts-expect-error -- legacy JavaScript UI type boundary
        isVisible={this.propTypes}
        onBackButtonPress={this.props.onPress}
        {...this.props}
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
      >
        <View style={styles.content}>
{/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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
