import React from 'react';
import {

  TouchableWithoutFeedback,
  View } from
'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import BottomSheet from '../../../../../component-library/components/BottomSheets/BottomSheet';
import { useStyles } from '../../../../../component-library/hooks';

import { Footer } from '../footer';
import Info from '../info-root';
import { LedgerContextProvider } from '../../context/ledger-context';
import { QRHardwareContextProvider } from '../../context/qr-hardware-context';
import Title from '../title';
import useApprovalRequest from '../../hooks/useApprovalRequest';
import { useConfirmActions } from '../../hooks/useConfirmActions';
import { useConfirmationRedesignEnabled } from '../../hooks/useConfirmationRedesignEnabled';
import { useFlatConfirmation } from '../../hooks/ui/useFlatConfirmation';
import styleSheet from './confirm-component.styles';
import { AlertsContextProvider } from '../../context/alert-system-context';
import useConfirmationAlerts from '../../hooks/alerts/useConfirmationAlerts';
import GeneralAlertBanner from '../general-alert-banner';

const ConfirmWrapped = ({
  styles,
  route



}) => {
  const alerts = useConfirmationAlerts();

  return (
    <AlertsContextProvider alerts={alerts}>
      <QRHardwareContextProvider>
        <LedgerContextProvider>
          <Title />
          <ScrollView style={styles.scrollView} nestedScrollEnabled>
            <TouchableWithoutFeedback>
              <>
                <GeneralAlertBanner />
                <Info route={route} />
              </>
            </TouchableWithoutFeedback>
          </ScrollView>
          <Footer />
        </LedgerContextProvider>
      </QRHardwareContextProvider>
    </AlertsContextProvider>);

};





export const Confirm = ({ route }) => {
  const { approvalRequest } = useApprovalRequest();
  const { isFlatConfirmation } = useFlatConfirmation();
  const { isRedesignedEnabled } = useConfirmationRedesignEnabled();
  const { onReject } = useConfirmActions();

  const { styles } = useStyles(styleSheet, {});

  if (!isRedesignedEnabled) {
    return null;
  }

  if (isFlatConfirmation) {
    return (
      <View style={styles.flatContainer} testID="flat-confirmation-container">
        <ConfirmWrapped styles={styles} route={route} />
      </View>);

  }

  return (
    <BottomSheet
      onClose={onReject}
      shouldNavigateBack={false}
      style={styles.bottomSheetDialogSheet}
      testID="modal-confirmation-container">
      
      <View testID={approvalRequest?.type} style={styles.confirmContainer}>
        <ConfirmWrapped styles={styles} route={route} />
      </View>
    </BottomSheet>);

};