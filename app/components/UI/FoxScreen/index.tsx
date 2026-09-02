import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import foxImage from '../../../images/branding/fox.png';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    image: {
      width: 100,
      height: 100,
    },
  });

/**
 * View component that displays the MetaMask fox
 * in the middle of the screen
 */
const FoxScreen = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper} testID={CommonSelectorsIDs.FOX_SCREEN}>
      <Image source={foxImage} style={styles.image} resizeMethod={'auto'} />
    </View>
  );
};

export default FoxScreen;
