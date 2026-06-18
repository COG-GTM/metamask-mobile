/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
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

const createStyles = (colors: Colors, titleColor: string) =>
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

interface Props {
  title?: string;
  description?: string;
  noBorder?: boolean;
  onPress?: () => void;
  warning?: string;
  renderArrowRight?: boolean;
  testID?: string;
  titleColor?: string;
}

const SettingsDrawer = ({
  title,
  description,
  onPress,
  warning,
  renderArrowRight = true,
  testID,
  titleColor = TextColor.Default,
}: Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, titleColor);
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
