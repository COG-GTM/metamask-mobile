import { Theme } from '../../../util/theme/models';
import React, { PureComponent } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { fontStyles, baseStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
// @ts-expect-error - react-native internal module has no type declarations
import dismissKeyboard from 'react-native/Libraries/Utilities/dismissKeyboard';
import IconCheck from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

const ROW_HEIGHT = 35;
const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    dropdown: {
      flexDirection: 'row',
    },
    iconDropdown: {
      marginTop: 7,
      height: 25,
      justifyContent: 'flex-end',
      textAlign: 'right',
      marginRight: 10,
    },
    selectedOption: {
      flex: 1,
      alignSelf: 'flex-start',
      color: colors.text.default,
      fontSize: 14,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 10,
      ...fontStyles.normal,
    },
    accesoryBar: {
      width: '100%',
      paddingTop: 5,
      height: 50,
      borderBottomColor: colors.border.muted,
      borderBottomWidth: 1,
    },
    label: {
      textAlign: 'center',
      flex: 1,
      paddingVertical: 10,
      fontSize: 17,
      ...fontStyles.bold,
      color: colors.text.default,
    },
    modal: {
      margin: 0,
      width: '100%',
      padding: 60,
    },
    modalView: {
      backgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
    },
    list: {
      width: '100%',
    },
    optionButton: {
      paddingHorizontal: 15,
      paddingVertical: 5,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: Device.isIos() ? ROW_HEIGHT : undefined,
    },
    optionLabel: {
      flex: 1,
      fontSize: 14,
      ...fontStyles.normal,
      color: colors.text.default,
    },
    icon: {
      paddingHorizontal: 10,
    },
    listWrapper: {
      flex: 1,
      paddingBottom: 10,
    },
  });

interface SelectComponentProps {
  /**
   * Default value to show
   */
  defaultValue?: string;
  /**
   * Label for the field
   */
  label?: string;
  /**
   * Selected value
   */
  selectedValue?: string;
  /**
   * Available options
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  /**
   * Callback for value change
   */
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange?: (...args: any[]) => any;
  testID?: string;
}

export default class SelectComponent extends PureComponent<SelectComponentProps> {
  state = {
    pickerVisible: false,
  };

  scrollView = Device.isIos() ? React.createRef<ScrollView>() : null;

  onValueChange = (val: string) => {
    (this.props.onValueChange as (val: string) => void)(val);
    setTimeout(() => {
      this.hidePicker();
    }, 1000);
  };

  hidePicker = () => {
    this.setState({ pickerVisible: false });
  };

  showPicker = () => {
    dismissKeyboard();
    this.setState({ pickerVisible: true });
    Device.isIos() &&
      // If there are more options than 13 (number of items
      // that should fit in a normal screen)
      // then let's scroll to the selected item
      this.props.options.length > 13 &&
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.props.options.forEach((item: any, i: number) => {
        if (item.value === this.props.selectedValue) {
          setTimeout(() => {
            this.scrollView?.current &&
              this.scrollView.current.scrollTo({
                x: 0,
                y: i * ROW_HEIGHT,
                animated: true,
              });
          }, 100);
        }
      });
  };

  getSelectedValue = () => {
    const { options, selectedValue, defaultValue } = this.props;
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = options?.filter((o: any) => o.value === selectedValue);
    if (el.length && el[0].label) {
      return el[0].label;
    }
    if (defaultValue) {
      return defaultValue;
    }
    return '';
  };

  renderDropdownSelector = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={baseStyles.flexGrow}>
        <TouchableOpacity onPress={this.showPicker} testID={this.props.testID}>
          <View style={styles.dropdown}>
            <Text style={styles.selectedOption} numberOfLines={1}>
              {this.getSelectedValue()}
            </Text>
            <Icon
              name={'arrow-drop-down'}
              size={24}
              color={colors.icon.default}
              style={styles.iconDropdown}
            />
          </View>
        </TouchableOpacity>
        <Modal
          isVisible={this.state.pickerVisible}
          onBackdropPress={this.hidePicker}
          onBackButtonPress={this.hidePicker}
          style={styles.modal}
          useNativeDriver
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
        >
          <View style={styles.modalView}>
            <View style={styles.accesoryBar}>
              <Text style={styles.label}>{this.props.label}</Text>
            </View>
            <ScrollView style={styles.list} ref={this.scrollView}>
              <View style={styles.listWrapper}>
                {/* TODO: Replace "any" with type */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {this.props.options.map((option: any) => (
                  <TouchableOpacity
                    // eslint-disable-next-line react/jsx-no-bind
                    onPress={() => this.onValueChange(option.value)}
                    style={styles.optionButton}
                    key={option.key}
                  >
                    <Text style={styles.optionLabel} numberOfLines={1}>
                      {option.label}
                    </Text>
                    {this.props.selectedValue === option.value ? (
                      <IconCheck
                        style={styles.icon}
                        name="check"
                        size={24}
                        color={colors.primary.default}
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  render = () => (
    <View style={baseStyles.flexGrow}>{this.renderDropdownSelector()}</View>
  );
}

SelectComponent.contextType = ThemeContext;
