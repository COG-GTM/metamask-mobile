import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
import RadioButton from '../../../component-library/components/RadioButton/RadioButton';


const createStyles = (_colors) =>
StyleSheet.create({
  root: {
    ...baseStyles.flexGrow,
    flexDirection: 'row'
  },
  option: {
    flex: 1
  }
});




























/**
 * Component that allows to select clicking two options
 */
export default class PickComponent extends PureComponent {
  static contextType = ThemeContext;

  pickFirst = () => {
    const { pick, valueFirst } = this.props;
    pick && pick(valueFirst);
  };

  pickSecond = () => {
    const { pick, valueSecond } = this.props;
    pick && pick(valueSecond);
  };

  render = () => {
    const { selectedValue, valueFirst, valueSecond, textFirst, textSecond } =
    this.props;
    const colors =
    this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.root}>
        <View style={styles.option}>
          <RadioButton
            onPress={this.pickFirst}
            isChecked={selectedValue === valueFirst}
            label={textFirst} />
          
        </View>
        <View style={styles.option}>
          <RadioButton
            onPress={this.pickSecond}
            isChecked={selectedValue === valueSecond}
            label={textSecond} />
          
        </View>
      </View>);

  };
}