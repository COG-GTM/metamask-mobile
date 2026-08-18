// Third party dependencies.
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';

// External dependencies.
import BottomSheet, {
  BottomSheetRef,
} from '../../../../component-library/components/BottomSheets/BottomSheet';
import ListItemSelect from '../../../../component-library/components/List/ListItemSelect';
import { VerticalAlignment } from '../../../../component-library/components/List/ListItem';
import Text, {
  TextVariant,
} from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../component-library/hooks';
import { ActivitiesViewSelectorsIDs } from '../../../../../e2e/selectors/Transactions/ActivitiesView.selectors';

// Internal dependencies.
import styleSheet from './ActivityFilterBottomSheet.styles';

export interface ActivityFilterOption<T extends string> {
  value: T;
  label: string;
}

export interface ActivityFilterBottomSheetProps<T extends string> {
  /** Sheet heading. */
  title: string;
  /** Options rendered in the order given. */
  options: ActivityFilterOption<T>[];
  /** Currently selected values. Selections within a sheet combine with OR. */
  selected: T[];
  /** Called with the next selection every time an option is toggled. */
  onChange: (selected: T[]) => void;
  /** Called once the sheet finished its dismiss animation. */
  onClose: () => void;
}

/**
 * Multi-select bottom sheet used by the activity type and status filters.
 * Toggling an option applies it immediately so the list behind the sheet
 * updates as selections are made.
 */
const ActivityFilterBottomSheet = <T extends string>({
  title,
  options,
  selected,
  onChange,
  onClose,
}: ActivityFilterBottomSheetProps<T>) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const { styles } = useStyles(styleSheet, {});

  const onOptionPress = useCallback(
    (value: T) => {
      onChange(
        selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      );
    },
    [onChange, selected],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      shouldNavigateBack={false}
      onClose={onClose}
      testID={ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET}
    >
      <View style={styles.wrapper}>
        <Text variant={TextVariant.HeadingMD} style={styles.title}>
          {title}
        </Text>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <ListItemSelect
              key={option.value}
              onPress={() => onOptionPress(option.value)}
              isSelected={isSelected}
              gap={8}
              verticalAlignment={VerticalAlignment.Center}
              accessibilityRole="checkbox"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
            </ListItemSelect>
          );
        })}
      </View>
    </BottomSheet>
  );
};

export default ActivityFilterBottomSheet;
