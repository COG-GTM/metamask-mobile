import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';
import generateTestId from '../../../../wdio/utils/generateTestId';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import ListItem from '../../../component-library/components/List/ListItem/ListItem';
import ListItemColumn, {
  WidthType,
} from '../../../component-library/components/List/ListItemColumn';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      padding: 16,
    },
    action: {
      paddingLeft: 16,
    },
    warningTag: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      height: 24,
      paddingHorizontal: 8,
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: colors.error.muted,
    },
    warningText: {
      marginLeft: 4,
    },
    menuItemWarningText: {
      color: colors.text.default,
      fontSize: 12,
      ...fontStyles.normal,
    },
  });

interface SettingsDrawerProps {
  title?: string;
  /**
   * Additional descriptive text about this option
   */
  description?: string;
  /**
   * Disable bottom border
   */
  noBorder?: boolean;
  /**
   * Handler called when this drawer is pressed
   */
  onPress?: () => void;
  /**
   * Display SettingsNotification
   */
  warning?: string;
  /**
   * Display arrow right
   */
  renderArrowRight?: boolean;
  /**
   * Test id for testing purposes
   */
  testID?: string;
  /**
   * Title color
   */
  titleColor?: TextColor;
}

const SettingsDrawer = ({
  title,
  description,
  onPress,
  warning,
  renderArrowRight = true,
  testID,
  titleColor = TextColor.Default,
}: SettingsDrawerProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity onPress={onPress} {...generateTestId(Platform, testID)}>
      <ListItem style={styles.root} gap={16}>
        <ListItemColumn widthType={WidthType.Fill}>
          <Text variant={TextVariant.BodyLGMedium} color={titleColor}>
            {title}
          </Text>
          {description && (
            <Text variant={TextVariant.BodyMD} color={TextColor.Alternative}>
              {description}
            </Text>
          )}
          {warning && (
            <View style={styles.warningTag}>
              <Icon
                size={IconSize.Sm}
                color={IconColor.Error}
                name={IconName.Danger}
              />
              <Text
                variant={TextVariant.BodyMD}
                color={TextColor.Error}
                style={styles.warningText}
              >
                {warning}
              </Text>
            </View>
          )}
        </ListItemColumn>
        {renderArrowRight && (
          <ListItemColumn>
            <Icon
              style={styles.action}
              size={IconSize.Md}
              name={IconName.ArrowRight}
            />
          </ListItemColumn>
        )}
      </ListItem>
    </TouchableOpacity>
  );
};

export default SettingsDrawer;
