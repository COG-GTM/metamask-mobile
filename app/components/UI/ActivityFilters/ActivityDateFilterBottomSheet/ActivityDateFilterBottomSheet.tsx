// Third party dependencies.
import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

// External dependencies.
import BottomSheet, {
  BottomSheetRef,
} from '../../../../component-library/components/BottomSheets/BottomSheet';
import Button, {
  ButtonSize,
  ButtonVariants,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import ListItemSelect from '../../../../component-library/components/List/ListItemSelect';
import { VerticalAlignment } from '../../../../component-library/components/List/ListItem';
import Text, {
  TextVariant,
} from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../component-library/hooks';
import { strings } from '../../../../../locales/i18n';
import { ActivitiesViewSelectorsIDs } from '../../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import {
  ActivityDateRange,
  DateRangePreset,
} from '../../../hooks/useActivityFilters';

// Internal dependencies.
import {
  ACTIVITY_DATE_LABEL_KEYS,
  ACTIVITY_DATE_PRESET_OPTIONS,
} from '../ActivityFilters.constants';
import styleSheet from '../ActivityFilterBottomSheet/ActivityFilterBottomSheet.styles';

export interface ActivityDateFilterBottomSheetProps {
  /** Currently applied date range, if any. */
  dateRange?: ActivityDateRange;
  /** Called with the next range, or undefined when the range is cleared. */
  onChange: (dateRange?: ActivityDateRange) => void;
  /** Called once the sheet finished its dismiss animation. */
  onClose: () => void;
}

enum CustomRangeBound {
  Start = 'start',
  End = 'end',
}

const formatDate = (time: number) => new Date(time).toDateString();

/**
 * Single-select date range bottom sheet. Presets apply immediately; the custom
 * range collects both bounds before applying so the list does not jump while
 * the second bound is still being picked.
 */
const ActivityDateFilterBottomSheet = ({
  dateRange,
  onChange,
  onClose,
}: ActivityDateFilterBottomSheetProps) => {
  const sheetRef = useRef<BottomSheetRef>(null);
  const { styles } = useStyles(styleSheet, {});

  const isCustom = dateRange?.preset === DateRangePreset.Custom;
  const [isCustomOpen, setIsCustomOpen] = useState(isCustom);
  const [startTime, setStartTime] = useState<number>(
    isCustom && dateRange?.startTime !== undefined
      ? dateRange.startTime
      : Date.now(),
  );
  const [endTime, setEndTime] = useState<number>(
    isCustom && dateRange?.endTime !== undefined
      ? dateRange.endTime
      : Date.now(),
  );
  const [visiblePicker, setVisiblePicker] = useState<CustomRangeBound | null>(
    null,
  );

  const onPresetPress = useCallback(
    (preset: DateRangePreset) => {
      if (preset === DateRangePreset.Custom) {
        setIsCustomOpen((current) => !current);
        return;
      }
      setIsCustomOpen(false);
      onChange(dateRange?.preset === preset ? undefined : { preset });
      sheetRef.current?.onCloseBottomSheet();
    },
    [dateRange, onChange],
  );

  const onPickerChange = useCallback(
    (bound: CustomRangeBound) => (_event: DateTimePickerEvent, date?: Date) => {
      setVisiblePicker(null);
      if (!date) {
        return;
      }
      if (bound === CustomRangeBound.Start) {
        setStartTime(date.getTime());
      } else {
        setEndTime(date.getTime());
      }
    },
    [],
  );

  const onApplyCustomRange = useCallback(() => {
    onChange({
      preset: DateRangePreset.Custom,
      startTime: Math.min(startTime, endTime),
      endTime: Math.max(startTime, endTime),
    });
    sheetRef.current?.onCloseBottomSheet();
  }, [endTime, onChange, startTime]);

  return (
    <BottomSheet
      ref={sheetRef}
      shouldNavigateBack={false}
      onClose={onClose}
      testID={ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET}
    >
      <View style={styles.wrapper}>
        <Text variant={TextVariant.HeadingMD} style={styles.title}>
          {strings('activity_view.filter_date_title')}
        </Text>
        {ACTIVITY_DATE_PRESET_OPTIONS.map((preset) => {
          const label = strings(ACTIVITY_DATE_LABEL_KEYS[preset]);
          const isSelected =
            preset === DateRangePreset.Custom
              ? isCustomOpen || isCustom
              : dateRange?.preset === preset;
          return (
            <ListItemSelect
              key={preset}
              onPress={() => onPresetPress(preset)}
              isSelected={isSelected}
              gap={8}
              verticalAlignment={VerticalAlignment.Center}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.optionLabel}>{label}</Text>
            </ListItemSelect>
          );
        })}
        {isCustomOpen && (
          <View style={styles.customRangeWrapper}>
            <View style={styles.customRangeRow}>
              <Text>{strings('activity_view.filter_date_start')}</Text>
              <Button
                variant={ButtonVariants.Link}
                size={ButtonSize.Sm}
                label={formatDate(startTime)}
                accessibilityLabel={strings('activity_view.filter_date_start')}
                onPress={() => setVisiblePicker(CustomRangeBound.Start)}
              />
            </View>
            <View style={styles.customRangeRow}>
              <Text>{strings('activity_view.filter_date_end')}</Text>
              <Button
                variant={ButtonVariants.Link}
                size={ButtonSize.Sm}
                label={formatDate(endTime)}
                accessibilityLabel={strings('activity_view.filter_date_end')}
                onPress={() => setVisiblePicker(CustomRangeBound.End)}
              />
            </View>
            <Button
              variant={ButtonVariants.Primary}
              size={ButtonSize.Md}
              width={ButtonWidthTypes.Full}
              style={styles.customRangeApply}
              label={strings('activity_view.filter_date_apply')}
              onPress={onApplyCustomRange}
            />
            {visiblePicker && (
              <DateTimePicker
                mode="date"
                display="default"
                value={
                  new Date(
                    visiblePicker === CustomRangeBound.Start
                      ? startTime
                      : endTime,
                  )
                }
                onChange={onPickerChange(visiblePicker)}
              />
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default ActivityDateFilterBottomSheet;
