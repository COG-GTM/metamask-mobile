import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useNavigationState } from '@react-navigation/native';
import {
  removeCurrentNotification as removeCurrentNotificationAction,
  hideCurrentNotification as hideCurrentNotificationAction,
  NotificationAction,
} from '../../../actions/notification';
import { NotificationTypes } from '../../../util/notifications';
import TransactionNotification from './TransactionNotification';
import SimpleNotification from './SimpleNotification';
import {
  currentNotificationSelector,
  InAppNotification,
} from '../../../reducers/notification';
import { RootState } from '../../../reducers';

import { findRouteNameFromNavigatorState } from '../../../util/general';
import usePrevious from '../../hooks/usePrevious';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

const { TRANSACTION, SIMPLE } = NotificationTypes;

const BROWSER_ROUTE = 'BrowserView';

export type AnimatedTimingStart = (
  animatedRef: SharedValue<number>,
  toValue: number,
  callback?: () => void,
) => void;

const isInAppNotification = (
  notification: InAppNotification | Record<string, never>,
): notification is InAppNotification => Boolean(notification?.type);

interface NotificationProps {
  currentNotification: InAppNotification | Record<string, never>;
  currentNotificationIsVisible: boolean;
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

function Notification({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification,
  removeCurrentNotification,
}: NotificationProps) {
  const notificationAnimated = useSharedValue(200);
  const routes = useNavigationState((state) => state.routes);

  const prevNotificationIsVisible = usePrevious(currentNotificationIsVisible);

  const animatedTimingStart: AnimatedTimingStart = useCallback(
    (animatedRef, toValue, callback) => {
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
      animatedTimingStart(notificationAnimated, 200, removeCurrentNotification);
      hideCurrentNotification();
    },
    [
      notificationAnimated,
      animatedTimingStart,
      hideCurrentNotification,
      removeCurrentNotification,
    ],
  );

  useEffect(() => {
    if (!prevNotificationIsVisible && currentNotificationIsVisible) {
      animatedTimingStart(notificationAnimated, 0);
      hideCurrentNotification();
      setTimeout(() => {
        animatedTimingStart(
          notificationAnimated,
          200,
          removeCurrentNotification,
        );
      }, Number(currentNotification.autodismiss || 5000));
    }
  }, [
    animatedTimingStart,
    hideCurrentNotification,
    removeCurrentNotification,
    currentNotificationIsVisible,
    prevNotificationIsVisible,
    currentNotification.autodismiss,
    notificationAnimated,
  ]);

  if (!isInAppNotification(currentNotification)) return null;
  if (currentNotification.type === TRANSACTION)
    return (
      <TransactionNotification
        onClose={hideCurrentNotification}
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

const mapStateToProps = (state: RootState) => {
  const currentNotification = currentNotificationSelector(state.notification);
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: Dispatch<NotificationAction>) => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotificationAction()),
  hideCurrentNotification: () => dispatch(hideCurrentNotificationAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
