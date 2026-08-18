// Third party dependencies.
import React, { useMemo } from 'react';
import { View } from 'react-native';

// External dependencies.
import ButtonBase from '../../../../component-library/components/Buttons/Button/foundation/ButtonBase';
import ButtonIcon from '../../../../component-library/components/Buttons/ButtonIcon';
import Button, {
  ButtonSize,
  ButtonVariants,
} from '../../../../component-library/components/Buttons/Button';
import { IconName } from '../../../../component-library/components/Icons/Icon';
import TextFieldSearch from '../../../../component-library/components/Form/TextFieldSearch';
import Text from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../component-library/hooks';
import { strings } from '../../../../../locales/i18n';
import { ActivitiesViewSelectorsIDs } from '../../../../../e2e/selectors/Transactions/ActivitiesView.selectors';
import {
  ActivityDateRange,
  ActivityFilterState,
  ActivityStatusCategory,
  ActivityTypeCategory,
} from '../../../hooks/useActivityFilters';

// Internal dependencies.
import {
  ACTIVITY_DATE_LABEL_KEYS,
  ACTIVITY_STATUS_LABEL_KEYS,
  ACTIVITY_TYPE_LABEL_KEYS,
  ActivityFilterSheet,
} from '../ActivityFilters.constants';
import styleSheet from './ActivityControlBar.styles';

export interface ActivityControlBarProps {
  /** Current filter state, owned by `useActivityFilters`. */
  filters: ActivityFilterState;
  /** Whether any filter currently constrains the list. */
  isFiltered: boolean;
  /** Renders the controls disabled while the list is still being computed. */
  isDisabled?: boolean;
  onQueryChange: (query: string) => void;
  onTypesChange: (types: ActivityTypeCategory[]) => void;
  onStatusesChange: (statuses: ActivityStatusCategory[]) => void;
  onDateRangeChange: (dateRange?: ActivityDateRange) => void;
  onClearFilters: () => void;
  /**
   * Asks the owner to open a filter bottom sheet. The sheets are rendered
   * outside the list so they can cover the screen rather than the list header.
   */
  onOpenSheet: (sheet: ActivityFilterSheet) => void;
}

interface ActiveFilterToken {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Search field, filter chips and active filter tokens rendered above the
 * activity list. Filter state lives in `useActivityFilters`; this component
 * only renders it and reports intent back.
 */
const ActivityControlBar = ({
  filters,
  isFiltered,
  isDisabled = false,
  onQueryChange,
  onTypesChange,
  onStatusesChange,
  onDateRangeChange,
  onClearFilters,
  onOpenSheet,
}: ActivityControlBarProps) => {
  const { styles } = useStyles(styleSheet, {});

  const clearButtonProps = filters.query
    ? {
        showClearButton: true as const,
        onPressClearButton: () => onQueryChange(''),
      }
    : {};

  const typeChipLabel = filters.types.length
    ? filters.types
        .map((type) => strings(ACTIVITY_TYPE_LABEL_KEYS[type]))
        .join(', ')
    : strings('activity_view.filter_type');

  const statusChipLabel = filters.statuses.length
    ? filters.statuses
        .map((status) => strings(ACTIVITY_STATUS_LABEL_KEYS[status]))
        .join(', ')
    : strings('activity_view.filter_status');

  const dateChipLabel = filters.dateRange
    ? strings(ACTIVITY_DATE_LABEL_KEYS[filters.dateRange.preset])
    : strings('activity_view.filter_date');

  const activeTokens = useMemo<ActiveFilterToken[]>(() => {
    const tokens: ActiveFilterToken[] = filters.types.map((type) => ({
      key: `type-${type}`,
      label: strings(ACTIVITY_TYPE_LABEL_KEYS[type]),
      onRemove: () =>
        onTypesChange(filters.types.filter((item) => item !== type)),
    }));

    filters.statuses.forEach((status) => {
      tokens.push({
        key: `status-${status}`,
        label: strings(ACTIVITY_STATUS_LABEL_KEYS[status]),
        onRemove: () =>
          onStatusesChange(filters.statuses.filter((item) => item !== status)),
      });
    });

    if (filters.dateRange) {
      tokens.push({
        key: `date-${filters.dateRange.preset}`,
        label: strings(ACTIVITY_DATE_LABEL_KEYS[filters.dateRange.preset]),
        onRemove: () => onDateRangeChange(undefined),
      });
    }

    return tokens;
  }, [filters, onDateRangeChange, onStatusesChange, onTypesChange]);

  const renderChip = (
    testID: string,
    label: string,
    isActive: boolean,
    sheet: ActivityFilterSheet,
  ) => (
    <ButtonBase
      testID={testID}
      label={
        <Text style={styles.chipLabel} numberOfLines={1}>
          {label}
        </Text>
      }
      endIconName={IconName.ArrowDown}
      onPress={() => !isDisabled && onOpenSheet(sheet)}
      isDisabled={isDisabled}
      style={isActive ? styles.chipActive : styles.chip}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
    />
  );

  return (
    <View style={styles.base} testID={ActivitiesViewSelectorsIDs.CONTROL_BAR}>
      <TextFieldSearch
        testID={ActivitiesViewSelectorsIDs.SEARCH_INPUT}
        value={filters.query}
        onChangeText={onQueryChange}
        placeholder={strings('activity_view.search_placeholder')}
        accessibilityRole="search"
        accessibilityLabel={strings('activity_view.search_placeholder')}
        isDisabled={isDisabled}
        {...clearButtonProps}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={styles.chipRow}>
        {renderChip(
          ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP,
          typeChipLabel,
          filters.types.length > 0,
          ActivityFilterSheet.Type,
        )}
        {renderChip(
          ActivitiesViewSelectorsIDs.STATUS_FILTER_CHIP,
          statusChipLabel,
          filters.statuses.length > 0,
          ActivityFilterSheet.Status,
        )}
        {renderChip(
          ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP,
          dateChipLabel,
          Boolean(filters.dateRange),
          ActivityFilterSheet.Date,
        )}
      </View>
      {isFiltered && (
        <View style={styles.activeFilterRow}>
          {activeTokens.map((token) => (
            <View
              key={token.key}
              style={styles.activeFilterToken}
              testID={ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN}
            >
              <Text style={styles.activeFilterTokenLabel}>{token.label}</Text>
              <ButtonIcon
                iconName={IconName.Close}
                onPress={token.onRemove}
                accessibilityRole="button"
                accessibilityLabel={strings('activity_view.remove_filter', {
                  filter: token.label,
                })}
              />
            </View>
          ))}
          <Button
            testID={ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS}
            variant={ButtonVariants.Link}
            size={ButtonSize.Sm}
            style={styles.clearAll}
            label={strings('activity_view.clear_all')}
            accessibilityRole="button"
            accessibilityLabel={strings('activity_view.clear_all')}
            onPress={onClearFilters}
          />
        </View>
      )}
    </View>
  );
};

export default ActivityControlBar;
