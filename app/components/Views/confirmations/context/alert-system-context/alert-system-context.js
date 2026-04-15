import React, { useContext, useMemo, useState } from 'react';
import { Severity } from '../../types/alerts';
import MultipleAlertModal from '../../components/modals/multiple-alert-modal';
import { useAlertsConfirmed } from '../../../../hooks/useAlertsConfirmed';






















const AlertsContext = React.createContext({
  alertKey: '',
  alertModalVisible: true,
  alerts: [],
  dangerAlerts: [],
  fieldAlerts: [],
  generalAlerts: [],
  hasAlerts: false,
  hasBlockingAlerts: false,
  hasDangerAlerts: false,
  hideAlertModal: () => undefined,
  setAlertKey: () => undefined,
  showAlertModal: () => undefined,
  hasUnconfirmedDangerAlerts: false,
  hasUnconfirmedFieldDangerAlerts: false,
  isAlertConfirmed: () => false,
  setAlertConfirmed: () => undefined,
  unconfirmedDangerAlerts: [],
  unconfirmedFieldDangerAlerts: []
});






export const AlertsContextProvider = ({
  children,
  alerts
}) => {
  const [alertModalVisible, setAlertModalVisible] = useState(false);

  /**
   * Sorted alerts by severity.
   */
  const alertsMemo = useMemo(() => sortAlertsBySeverity(alerts), [alerts]);

  /**
   * General alerts (alerts without a specific field).
   */
  const generalAlerts = useMemo(
    () =>
    alertsMemo.filter((alertSelected) => alertSelected.field === undefined),
    [alertsMemo]
  );

  /**
   * Field alerts (alerts with a specific field).
   */
  const fieldAlerts = useMemo(
    () =>
    alertsMemo.filter((alertSelected) => alertSelected.field !== undefined),
    [alertsMemo]
  );

  /**
   * Danger alerts.
   */
  const dangerAlerts = useMemo(
    () =>
    alertsMemo.filter(
      (alertSelected) => alertSelected.severity === Severity.Danger
    ),
    [alertsMemo]
  );

  const initialAlertKey = fieldAlerts[0]?.key ?? '';

  const [alertKey, setAlertKey] = useState(initialAlertKey);

  const {
    hasBlockingAlerts,
    hasUnconfirmedDangerAlerts,
    hasUnconfirmedFieldDangerAlerts,
    isAlertConfirmed,
    setAlertConfirmed,
    unconfirmedDangerAlerts,
    unconfirmedFieldDangerAlerts
  } = useAlertsConfirmed(fieldAlerts);

  const contextValue = useMemo(
    () => ({
      alertKey,
      alertModalVisible,
      alerts: alertsMemo,
      dangerAlerts,
      fieldAlerts,
      generalAlerts,
      hasAlerts: alertsMemo.length > 0,
      hasBlockingAlerts,
      hasDangerAlerts: dangerAlerts.length > 0,
      hideAlertModal: () => setAlertModalVisible(false),
      setAlertKey: (key) => setAlertKey(key),
      showAlertModal: () => setAlertModalVisible(true),
      hasUnconfirmedDangerAlerts,
      hasUnconfirmedFieldDangerAlerts,
      isAlertConfirmed,
      setAlertConfirmed,
      unconfirmedDangerAlerts,
      unconfirmedFieldDangerAlerts
    }),
    [
    alertKey,
    alertModalVisible,
    alertsMemo,
    dangerAlerts,
    fieldAlerts,
    generalAlerts,
    hasBlockingAlerts,
    hasUnconfirmedDangerAlerts,
    hasUnconfirmedFieldDangerAlerts,
    isAlertConfirmed,
    setAlertConfirmed,
    unconfirmedDangerAlerts,
    unconfirmedFieldDangerAlerts]

  );

  return (
    <AlertsContext.Provider value={contextValue}>
      {children}
      <MultipleAlertModal />
    </AlertsContext.Provider>);

};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsContextProvider');
  }
  return context;
};

/**
 * Sorts alerts by severity.
 * @param alerts - Array of alerts to sort.
 * @returns Sorted array of alerts.
 */
function sortAlertsBySeverity(alerts) {
  const severityOrder = {
    [Severity.Danger]: 3,
    [Severity.Warning]: 2,
    [Severity.Info]: 1
  };
  return [...alerts].sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
  );
}