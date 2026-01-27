import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
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
} from 'react-native-reanimated';
import { RootState } from '../../../reducers';

const { TRANSACTION, SIMPLE } = NotificationTypes;

const BROWSER_ROUTE = 'BrowserView';

interface CurrentNotification {
  type?: string;
  isVisible?: boolean;
  autodismiss?: number;
  status?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface NotificationProps {
  currentNotification: CurrentNotification;
  currentNotificationIsVisible: boolean;
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification: hideNotification,
  removeCurrentNotification: removeNotification,
}) => {
  const notificationAnimated = useSharedValue(200);
  const routes = useNavigationState((state) => state.routes);

  const prevNotificationIsVisible = usePrevious(currentNotificationIsVisible);

  const animatedTimingStart = useCallback(
    (
      animatedRef: { value: number },
      toValue: number,
      callback?: () => void,
    ) => {
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
        animatedTimingStart(notificationAnimated, 200, removeNotification);
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
};

const mapStateToProps = (state: RootState) => {
  const currentNotification = currentNotificationSelector(state.notification);
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotification()),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
