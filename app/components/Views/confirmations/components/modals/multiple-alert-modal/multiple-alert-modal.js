import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useAlerts } from '../../../context/alert-system-context';
import { Severity } from '../../../types/alerts';
import ButtonIcon from '../../../../../../component-library/components/Buttons/ButtonIcon';
import Icon, {
  IconColor,
  IconName,
  IconSize } from
'../../../../../../component-library/components/Icons/Icon';
import AlertModal from '../alert-modal';

import HeaderBase from '../../../../../../component-library/components/HeaderBase';
import { getSeverityStyle } from '../../../utils/alert-system';
import { useTheme } from '../../../../../../util/theme';
import { useStyles } from '../../../../../hooks/useStyles';
import styleSheet from './multiple-alert-modal.styles';








const PreviousButton =


({ onBackButtonClick, selectedIndex }) => {
  if (selectedIndex <= 0) {
    return null;
  }

  return (
    <ButtonIcon
      iconColor={IconColor.Default}
      iconName={IconName.ArrowLeft}
      onPress={onBackButtonClick}
      testID="alert-button-icon-arrow-left" />);


};

const NextButton =



({ alertsLength, onNextButtonClick, selectedIndex }) => {
  if (selectedIndex >= alertsLength - 1) {
    return null;
  }

  return (
    <ButtonIcon
      iconColor={IconColor.Default}
      iconName={IconName.ArrowRight}
      onPress={onNextButtonClick}
      testID="alert-button-icon-arrow-right" />);


};

const NavigationAlertHeader = ({
  arrLength,
  children,
  onBack,
  onForward,
  selectedIndex,
  style,
  ...props
}) =>
<HeaderBase
  endAccessory={
  <NextButton
    alertsLength={arrLength}
    onNextButtonClick={onForward}
    selectedIndex={selectedIndex} />

  }
  startAccessory={
  <PreviousButton
    onBackButtonClick={onBack}
    selectedIndex={selectedIndex} />

  }
  style={style}
  {...props}>
  
    {children}
  </HeaderBase>;


const PageNavigation =






({
  alerts,
  iconColor,
  onBackButtonClick,
  onNextButtonClick,
  selectedIndex,
  severity
}) => {
  const { styles } = useStyles(styleSheet, {});
  if (alerts.length <= 1) {
    return null;
  }

  return (
    <View style={styles.pageNavigation}>
      <NavigationAlertHeader
        arrLength={alerts.length}
        onBack={onBackButtonClick}
        onForward={onNextButtonClick}
        selectedIndex={selectedIndex}
        style={styles.navAlertHeader}>
        
        <Icon
          color={iconColor}
          name={severity === Severity.Info ? IconName.Info : IconName.Danger}
          size={IconSize.Xl}
          testID="multiple-alert-modal-icon" />
        
      </NavigationAlertHeader>
    </View>);

};

const MultipleAlertModal = () => {
  const { colors } = useTheme();
  const { alertKey, fieldAlerts, hideAlertModal, setAlertKey } = useAlerts();
  const initialAlertIndex = fieldAlerts.findIndex(
    (selectedAlert) => selectedAlert.key === alertKey
  );
  const [selectedIndex, setSelectedIndex] = useState(
    initialAlertIndex === -1 ? 0 : initialAlertIndex
  );

  const handleBackButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex) =>
    prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
    setAlertKey(fieldAlerts[selectedIndex - 1].key);
  }, [fieldAlerts, selectedIndex, setAlertKey]);

  const handleNextButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex) =>
    prevIndex < fieldAlerts.length - 1 ? prevIndex + 1 : prevIndex
    );
    setAlertKey(fieldAlerts[selectedIndex + 1].key);
  }, [fieldAlerts, selectedIndex, setAlertKey]);

  const handleAcknowledgeClick = useCallback(() => {
    if (selectedIndex + 1 === fieldAlerts.length) {
      hideAlertModal();
    } else {
      handleNextButtonClick();
    }
  }, [
  selectedIndex,
  fieldAlerts.length,
  hideAlertModal,
  handleNextButtonClick]
  );

  const selectedAlert = fieldAlerts[selectedIndex];

  if (!selectedAlert) {
    return null;
  }

  const severityStyle = getSeverityStyle(selectedAlert.severity, colors);

  if (fieldAlerts.length <= 1) {
    return <AlertModal />;
  }

  return (
    <AlertModal
      headerAccessory={
      <PageNavigation
        alerts={fieldAlerts}
        iconColor={severityStyle.icon}
        onBackButtonClick={handleBackButtonClick}
        onNextButtonClick={handleNextButtonClick}
        selectedIndex={selectedIndex}
        severity={selectedAlert.severity} />

      }
      onAcknowledgeClick={handleAcknowledgeClick} />);


};

export default MultipleAlertModal;