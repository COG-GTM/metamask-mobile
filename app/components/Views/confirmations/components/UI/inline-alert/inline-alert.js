import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { strings } from '../../../../../../../locales/i18n';
import { useStyles } from '../../../../../../component-library/hooks';
import Icon, { IconName, IconSize } from '../../../../../../component-library/components/Icons/Icon';
import Text, { TextColor, TextVariant } from '../../../../../../component-library/components/Texts/Text';
import { IconSizes } from '../../../../../../component-library/components-temp/KeyValueRow';
import { useTheme } from '../../../../../../util/theme';
import { Severity } from '../../../types/alerts';
import styleSheet from './inline-alert.styles';










const getBackgroundColor = (severity, colors) => {
  switch (severity) {
    case Severity.Danger:
      return colors.error.muted;
    case Severity.Warning:
      return colors.warning.muted;
    default:
      return colors.info.muted;
  }
};

const getTextColor = (severity) => {
  switch (severity) {
    case Severity.Danger:
      return TextColor.Error;
    case Severity.Warning:
      return TextColor.Warning;
    default:
      return TextColor.Info;
  }
};

export default function InlineAlert({
  onClick,
  severity = Severity.Info,
  style
}) {
  const { colors } = useTheme();
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={[styles.wrapper, { backgroundColor: getBackgroundColor(severity, colors) }, style]}>
      <TouchableOpacity
        testID="inline-alert"
        onPress={onClick}
        style={styles.inlineContainer}>
        
        <Icon
          name={severity === Severity.Info ? IconName.Info : IconName.Danger}
          size={IconSize.Sm}
          color={getTextColor(severity)}
          style={styles.icon}
          testID="inline-alert-icon" />
        
        <Text variant={TextVariant.BodySM} color={getTextColor(severity)}>
          {strings('alert_system.inline_alert_label')}
        </Text>
        <Icon name={IconName.ArrowRight} size={IconSizes.Xs} color={getTextColor(severity)} />
      </TouchableOpacity>
    </View>);

}