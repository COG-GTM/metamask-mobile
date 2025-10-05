import React, { PureComponent } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { Theme } from '@metamask/design-tokens';
// eslint-disable-next-line import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const foxImage: ImageSourcePropType = require('../../../images/branding/fox.png');

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    foxImage: {
      width: 100,
      height: 100,
      tintColor: colors.primary.default,
    },
  });

export default class FoxScreen extends PureComponent {
  static contextType = ThemeContext;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  context: React.ContextType<typeof ThemeContext> = undefined!;

  render = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View
        style={styles.wrapper}
        testID={CommonSelectorsIDs.FOX_SCREEN}
        accessible
        accessibilityLabel={CommonSelectorsIDs.FOX_SCREEN}
      >
        <Image source={foxImage} style={styles.foxImage} resizeMode="contain" />
      </View>
    );
  };
}
