import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ViewStyle, TextStyle } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
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
import { Theme } from '../../../util/theme/models';

interface Styles {
  root: ViewStyle;
  action: ViewStyle;
  warningTag: ViewStyle;
  warningText: TextStyle;
  menuItemWarningText: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
  description?: string;
  noBorder?: boolean;
  onPress?: () => void;
  warning?: string;
  renderArrowRight?: boolean;
  testID?: string;
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
