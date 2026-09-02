import React, { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { fontStyles, baseStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import IconCheck from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';

const ROW_HEIGHT = 35;
const createStyles = (colors: Colors) =>
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

export interface SelectOption<T> {
  key?: string | number;
  value?: T;
  label?: string;
}

interface Props<T> {
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
  selectedValue?: string | T;
  /**
   * Available options
   */
  options?: SelectOption<T>[];
  /**
   * Callback for value change
   */
  onValueChange?: (value: T) => void;
  testID?: string;
}

const SelectComponent = <T,>({
  defaultValue,
  label,
  selectedValue,
  options,
  onValueChange,
  testID,
}: Props<T>) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const scrollView = useRef<ScrollView>(null);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const hidePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handleValueChange = useCallback(
    (val: T) => {
      onValueChange?.(val);
      setTimeout(() => {
        hidePicker();
      }, 1000);
    },
    [onValueChange, hidePicker],
  );

  const showPicker = useCallback(() => {
    Keyboard.dismiss();
    setPickerVisible(true);
    Device.isIos() &&
      // If there are more options than 13 (number of items
      // that should fit in a normal screen)
      // then let's scroll to the selected item
      options &&
      options.length > 13 &&
      options.forEach((item, i) => {
        if (item.value === selectedValue) {
          setTimeout(() => {
            scrollView.current &&
              scrollView.current.scrollTo({
                x: 0,
                y: i * ROW_HEIGHT,
                animated: true,
              });
          }, 100);
        }
      });
  }, [options, selectedValue]);

  const getSelectedValue = () => {
    const el = options?.filter((o) => o.value === selectedValue);
    if (el?.length && el[0].label) {
      return el[0].label;
    }
    if (defaultValue) {
      return defaultValue;
    }
    return '';
  };

  return (
    <View style={baseStyles.flexGrow}>
      <View style={baseStyles.flexGrow}>
        <TouchableOpacity onPress={showPicker} testID={testID}>
          <View style={styles.dropdown}>
            <Text style={styles.selectedOption} numberOfLines={1}>
              {getSelectedValue()}
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
          isVisible={pickerVisible}
          onBackdropPress={hidePicker}
          onBackButtonPress={hidePicker}
          style={styles.modal}
          useNativeDriver
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
        >
          <View style={styles.modalView}>
            <View style={styles.accesoryBar}>
              <Text style={styles.label}>{label}</Text>
            </View>
            <ScrollView
              style={styles.list}
              ref={Device.isIos() ? scrollView : null}
            >
              <View style={styles.listWrapper}>
                {options?.map((option) => (
                  <TouchableOpacity
                    // eslint-disable-next-line react/jsx-no-bind
                    onPress={() => handleValueChange(option.value as T)}
                    style={styles.optionButton}
                    key={option.key}
                  >
                    <Text style={styles.optionLabel} numberOfLines={1}>
                      {option.label}
                    </Text>
                    {selectedValue === option.value ? (
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
    </View>
  );
};

export default SelectComponent;
