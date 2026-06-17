import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useNavigationState } from '@react-navigation/native';
import {
  removeCurrentNotification,
  hideCurrentNotification,
} from '../../../actions/notification';
import { NotificationTypes } from '../../../util/notifications';
import TransactionNotification from './TransactionNotification';
import SimpleNotification from './SimpleNotification';
import { currentNotificationSelector } from '../../../reducers/notification';

import { findRouteNameFromNavigatorState } from '../../../util/general';
import usePrevious from '../../hooks/usePrevious';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { RootState } from '../../../reducers';

const { TRANSACTION, SIMPLE } = NotificationTypes;

const BROWSER_ROUTE = 'BrowserView';

interface CurrentNotificationData {
  type?: string;
  autodismiss?: number;
  isVisible?: boolean;
  status?: string;
  title?: string;
  description?: string;
  transaction?: { id?: string };
}

interface NotificationStateProps {
  currentNotification: CurrentNotificationData;
  currentNotificationIsVisible: boolean;
}

interface NotificationDispatchProps {
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

type NotificationProps = NotificationStateProps & NotificationDispatchProps;

function Notification({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification: hideNotification,
  removeCurrentNotification: removeNotification,
}: NotificationProps) {
  const notificationAnimated = useSharedValue(200);
  const routes = useNavigationState((state) => state.routes);

  const prevNotificationIsVisible = usePrevious(currentNotificationIsVisible);

  const animatedTimingStart = useCallback(
    (animatedRef: SharedValue<number>, toValue: number, callback?: () => void) => {
      animatedRef.value = withTiming(
        toValue,
        { duration: 500, easing: Easing.linear },
        () => callback && runOnJS(callback)(),
      );
    },
    [],
  );

  const isInBrowserView = useMemo(
    () => findRouteNameFromNavigatorState(routes) === BROWSER_ROUTE,
    [routes],
  );

  useEffect(
    () => () => {
      animatedTimingStart(notificationAnimated, 200, removeNotification);
      hideNotification();
    },
    [
      notificationAnimated,
      animatedTimingStart,
      hideNotification,
      removeNotification,
    ],
  );

  useEffect(() => {
    if (!prevNotificationIsVisible && currentNotificationIsVisible) {
      animatedTimingStart(notificationAnimated, 0);
      hideNotification();
      setTimeout(() => {
        animatedTimingStart(
          notificationAnimated,
          200,
          removeNotification,
        );
      }, currentNotification.autodismiss || 5000);
    }
  }, [
    animatedTimingStart,
    hideNotification,
    removeNotification,
    currentNotificationIsVisible,
    prevNotificationIsVisible,
    currentNotification.autodismiss,
    notificationAnimated,
  ]);

  if (!currentNotification?.type) return null;
  if (currentNotification.type === TRANSACTION)
    return (
      <TransactionNotification
        onClose={hideNotification}
        isInBrowserView={isInBrowserView}
        notificationAnimated={notificationAnimated}
        animatedTimingStart={animatedTimingStart}
        currentNotification={currentNotification}
      />
    );
  if (currentNotification.type === SIMPLE)
    return (
      <SimpleNotification
        isInBrowserView={isInBrowserView}
        notificationAnimated={notificationAnimated}
        currentNotification={currentNotification}
      />
    );
  return null;
}

const mapStateToProps = (state: RootState): NotificationStateProps => {
  const currentNotification = (
    currentNotificationSelector as unknown as (
      s: RootState['notification'],
    ) => CurrentNotificationData
  )(state.notification);
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): NotificationDispatchProps => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotification()),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
