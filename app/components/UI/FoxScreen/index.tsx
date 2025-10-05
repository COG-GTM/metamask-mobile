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

export default class FoxScreen extends PureComponent {
  static contextType = ThemeContext;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  context: React.ContextType<typeof ThemeContext> = undefined!;

  render = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper} testID={CommonSelectorsIDs.FOX_SCREEN}>
        <Image source={foxImage} style={styles.image} resizeMethod={'auto'} />
      </View>
    );
  };
}
