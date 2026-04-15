import React from 'react';
import { StyleSheet, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';


const createStyles = (colors) =>
StyleSheet.create({
  chevron: {
    marginLeft: 10,
    color: colors.icon.default
  }
});





const DownChevronText = ({ text, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View {...props}>
      <Text black>
        <Text black bold>
          {text}
        </Text>
        {'  '}
        <Entypo name="chevron-down" size={16} style={styles.chevron} />
      </Text>
    </View>);

};

export default DownChevronText;