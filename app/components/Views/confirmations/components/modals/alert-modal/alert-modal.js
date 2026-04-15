import React, { useCallback, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import BottomModal from '../../../components/UI/bottom-modal';
import Button, {
  ButtonSize,
  ButtonVariants,
  ButtonWidthTypes } from
'../../../../../../component-library/components/Buttons/Button';
import Checkbox from '../../../../../../component-library/components/Checkbox';
import Icon, {
  IconName,
  IconSize } from
'../../../../../../component-library/components/Icons/Icon';
import Text, {
  TextVariant } from
'../../../../../../component-library/components/Texts/Text';
import { Severity } from '../../../types/alerts';
import { getSeverityStyle } from '../../../utils/alert-system';
import { strings } from '../../../../../../../locales/i18n';
import { useAlerts } from '../../../context/alert-system-context';
import { useConfirmationAlertMetrics } from '../../../hooks/metrics/useConfirmationAlertMetrics';
import { useStyles } from '../../../../../hooks/useStyles';
import { useTheme } from '../../../../../../util/theme';
import styleSheet from './alert-modal.styles';








const Header = ({
  selectedAlert,
  iconColor,
  styles,
  headerAccessory
}) =>
<>
    {headerAccessory ??
  <View style={styles.iconWrapper}>
        <Icon
      name={
      selectedAlert.severity === Severity.Info ?
      IconName.Info :
      IconName.Danger
      }
      size={IconSize.Xl}
      color={iconColor}
      testID="alert-modal-icon" />
    
      </View>
  }
    <View style={styles.headerContainer}>
      <Text style={styles.headerText} variant={TextVariant.BodyMDBold}>
        {selectedAlert.title ?? strings('alert_system.alert_modal.title')}
      </Text>
    </View>
  </>;








const Content = ({
  backgroundColor,
  selectedAlert,
  styles
}) =>
<View style={[styles.content, { backgroundColor }]}>
    {selectedAlert.content ??
  <>
        <Text style={styles.message}>{selectedAlert.message}</Text>
        {selectedAlert.alertDetails &&
    <>
            <Text style={styles.message} variant={TextVariant.BodyMDBold}>
              {strings('alert_system.alert_modal.alert_details')}
            </Text>
            {selectedAlert.alertDetails.map((detail, index) =>
      <Text
        key={`details-${index}`}
        style={styles.detailsText}
        variant={TextVariant.BodyMD}>
        
                {'• ' + detail}
              </Text>
      )}
          </>
    }
      </>
  }
  </View>;









const AlertCheckbox = ({
  selectedAlert,
  isConfirmed,
  onCheckboxClick,
  styles
}) => {
  if (selectedAlert.severity !== Severity.Danger || selectedAlert.isBlocking) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => onCheckboxClick(isConfirmed)}
      activeOpacity={1}>
      
      <Checkbox
        onPress={() => onCheckboxClick(isConfirmed)}
        isChecked={isConfirmed}
        testID="alert-modal-checkbox" />
      
      <Text style={styles.checkboxText}>
        {strings('alert_system.confirm_modal.checkbox_label')}
      </Text>
    </TouchableOpacity>);

};









const Buttons = ({
  hideAlertModal,
  action,
  styles,
  onHandleActionClick,
  isConfirmed
}) =>
<View style={styles.buttonsContainer}>
    <Button
    onPress={hideAlertModal}
    label={strings('alert_system.alert_modal.got_it_btn')}
    style={styles.footerButton}
    size={ButtonSize.Lg}
    variant={action ? ButtonVariants.Secondary : ButtonVariants.Primary}
    width={ButtonWidthTypes.Full}
    isDisabled={!isConfirmed}
    testID="alert-modal-got-it-button" />
  
    {action ?
  <>
        <View style={styles.buttonDivider} />
        <Button
      onPress={() => onHandleActionClick(action.callback)}
      label={action.label}
      style={styles.footerButton}
      size={ButtonSize.Lg}
      variant={ButtonVariants.Primary}
      width={ButtonWidthTypes.Full} />
    
      </> :
  null}
  </View>;







const AlertModal = ({
  headerAccessory,
  onAcknowledgeClick
}) => {
  const { colors } = useTheme();
  const styles = useStyles(styleSheet, {}).styles;
  const {
    hideAlertModal,
    alertModalVisible,
    fieldAlerts,
    alertKey,
    isAlertConfirmed,
    setAlertConfirmed
  } = useAlerts();
  const { trackAlertRendered } = useConfirmationAlertMetrics();

  useEffect(() => {
    if (alertModalVisible) {
      trackAlertRendered();
    }
  }, [alertModalVisible, trackAlertRendered]);

  const handleClose = useCallback(() => {
    if (onAcknowledgeClick) {
      onAcknowledgeClick();
      return;
    }
    hideAlertModal();
  }, [hideAlertModal, onAcknowledgeClick]);

  const handleCheckboxClick = useCallback(
    (selectedAlertKey, isConfirmed) => {
      setAlertConfirmed(selectedAlertKey, !isConfirmed);
    },
    [setAlertConfirmed]
  );

  const handleActionClick = useCallback(
    (callback) => {
      callback();
      hideAlertModal();
    },
    [hideAlertModal]
  );

  const selectedAlert = fieldAlerts.find(
    (alertSelected) => alertSelected.key === alertKey
  );

  if (!alertModalVisible || !selectedAlert) {
    return null;
  }

  const isConfirmed = isAlertConfirmed(selectedAlert.key);
  const severityStyle = getSeverityStyle(selectedAlert.severity, colors);

  return (
    <BottomModal onClose={hideAlertModal}>
      <View style={styles.modalContainer}>
        <Header
          selectedAlert={selectedAlert}
          iconColor={severityStyle.icon}
          styles={styles}
          headerAccessory={headerAccessory} />
        
        <View>
          <Content
            backgroundColor={severityStyle.background}
            selectedAlert={selectedAlert}
            styles={styles} />
          
          <AlertCheckbox
            selectedAlert={selectedAlert}
            isConfirmed={isConfirmed}
            onCheckboxClick={() =>
            handleCheckboxClick(selectedAlert.key, isConfirmed)
            }
            styles={styles} />
          
        </View>
        <Buttons
          hideAlertModal={handleClose}
          action={selectedAlert.action}
          styles={styles}
          onHandleActionClick={handleActionClick}
          isConfirmed={isConfirmed} />
        
      </View>
    </BottomModal>);

};

export default AlertModal;