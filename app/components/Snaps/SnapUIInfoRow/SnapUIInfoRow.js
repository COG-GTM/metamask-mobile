import React from 'react';
import { View } from 'react-native';
import Text, {
  TextVariant,
  TextColor } from
'../../../component-library/components/Texts/Text';
import { useStyles } from '../../../component-library/hooks';
import Tooltip from '../../Views/confirmations/components/UI/Tooltip';
import styleSheet from './SnapUIInfoRow.styles';
import { IconColor } from '../../../component-library/components/Icons/Icon';

export let RowVariant = /*#__PURE__*/function (RowVariant) {RowVariant["Default"] = "default";RowVariant["Critical"] = "critical";RowVariant["Warning"] = "warning";return RowVariant;}({});
















const getColorFromVariant = (variant) => {
  if (variant === RowVariant.Critical || variant === 'critical')
  return TextColor.Error;
  if (variant === RowVariant.Warning || variant === 'warning')
  return TextColor.Warning;
  return TextColor.Default;
};

const getIconColorFromVariant = (variant) => {
  if (variant === RowVariant.Critical || variant === 'critical')
  return IconColor.Error;
  if (variant === RowVariant.Warning || variant === 'warning')
  return IconColor.Warning;
  return IconColor.Muted; // Default tooltip color
};

const getContainerStyle = (
styles,
variant) =>
{
  if (variant === RowVariant.Critical || variant === 'critical')
  return [styles.container, styles.containerCritical];
  if (variant === RowVariant.Warning || variant === 'warning')
  return [styles.container, styles.containerWarning];
  return [styles.container];
};

export const SnapUIInfoRow = ({
  label,
  children,
  onTooltipPress,
  style = {},
  labelChildren = null,
  tooltip,
  testID,
  variant = RowVariant.Default
}) => {
  const { styles } = useStyles(styleSheet, {});
  const textColor = getColorFromVariant(variant);
  const iconColor = getIconColorFromVariant(variant);
  const containerStyle = getContainerStyle(styles, variant);

  const tooltipProps = {
    content: tooltip,
    onPress: onTooltipPress,
    title: label,
    iconColor
  };

  return (
    <View
      style={[...containerStyle, style]}
      testID={testID ?? 'snap-ui-info-row'}>
      
      {Boolean(label) &&
      <View
        style={styles.labelContainer}
        testID="snap-ui-info-row-label-container">
        
          <Text
          variant={TextVariant.BodyMDMedium}
          color={textColor}
          testID="snap-ui-info-row-label">
          
            {label}
          </Text>
          {labelChildren}
          {!labelChildren && tooltip &&
        <View testID="snap-ui-info-row-tooltip-container">
              <Tooltip {...tooltipProps} />
            </View>
        }
        </View>
      }
      {typeof children === 'string' ?
      <Text
        style={styles.value}
        color={textColor}
        testID="snap-ui-info-row-value">
        
          {children}
        </Text> :

      <View testID="snap-ui-info-row-children-container">{children}</View>
      }
    </View>);

};

export default SnapUIInfoRow;