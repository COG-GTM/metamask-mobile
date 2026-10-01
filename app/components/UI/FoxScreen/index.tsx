import React, { PureComponent } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';

interface ThemeColors {
  background: { default: string };
}

const createStyles = (colors: ThemeColors) =>
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

const foxImage = require('../../../images/branding/fox.png'); // eslint-disable-line import/no-commonjs

export default class FoxScreen extends PureComponent {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  render = (): React.ReactNode => {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper} testID={CommonSelectorsIDs.FOX_SCREEN}>
        <Image source={foxImage} style={styles.image} resizeMethod={'auto'} />
      </View>
    );
  };
}
