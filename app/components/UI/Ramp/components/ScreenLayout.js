import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView } from



'react-native';
import { useTheme } from '../../../../util/theme';

import Text from '../../../Base/Text';

const createStyles = (colors) =>
StyleSheet.create({
  wrapper: {
    flex: 1
  },
  container: {
    backgroundColor: colors.background.default,
    flex: 1
  },
  content: {
    padding: 15
  },
  grow: {
    flex: 1
  },
  header: {
    marginVertical: 16,
    alignItems: 'center'
  },
  body: {
    flex: 1
  },
  description: {
    marginHorizontal: 20
  }
});





























const ScreenLayout = ({ style, scrollable, ...props }) => {
  const Component = scrollable ? ScrollView : View;
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.wrapper}>
      <Component style={[styles.container, style]} {...props} />
    </SafeAreaView>);

};

const Header = ({
  title,
  description,
  bold,
  children,
  style,
  titleStyle,
  descriptionStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.header, style]} {...props}>
      {title &&
      <Text style={titleStyle} big black centered bold={bold}>
          {typeof title === 'function' ? title() : title}
        </Text>
      }
      {description &&
      <Text style={[styles.description, descriptionStyle]} centered grey>
          {description}
        </Text>
      }
      {children}
    </View>);

};

const Body = ({ style, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.body, style]} {...props} />;
};

const Footer = ({ style, ...props }) =>
<View style={style} {...props} />;

const Content = ({ style, grow, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.content, grow && styles.grow, style]} {...props} />);

};

ScreenLayout.Header = Header;
ScreenLayout.Body = Body;
ScreenLayout.Footer = Footer;
ScreenLayout.Content = Content;

export default ScreenLayout;