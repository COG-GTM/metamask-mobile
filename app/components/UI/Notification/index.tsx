import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { RootState } from '../../../reducers';
import { SharedValue } from 'react-native-reanimated';
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

const { TRANSACTION, SIMPLE } = NotificationTypes;

const BROWSER_ROUTE = 'BrowserView';

interface NotificationData {
  type?: string;
  autodismiss?: number;
  isVisible?: boolean;
  [key: string]: unknown;
}

interface OwnProps {}

interface StateProps {
  currentNotification: NotificationData;
  currentNotificationIsVisible: boolean;
}

interface DispatchProps {
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

type Props = OwnProps & StateProps & DispatchProps;

function Notification({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification,
  removeCurrentNotification,
}: Props) {
  const notificationAnimated = useSharedValue(200);
  const routes = useNavigationState((state) => state.routes);

  const prevNotificationIsVisible = usePrevious(currentNotificationIsVisible);

  const animatedTimingStart = useCallback((animatedRef: SharedValue<number>, toValue: number, callback?: () => void) => {
    animatedRef.value = withTiming(
      toValue,
      { duration: 500, easing: Easing.linear },
      () => callback && runOnJS(callback)(),
    );
  }, []);

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
      }, currentNotification.autodismiss || 5000);
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

  if (!currentNotification?.type) return null;
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

const mapStateToProps = (state: RootState): StateProps => {
  const currentNotification = currentNotificationSelector(state.notification);
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: (action: unknown) => void): DispatchProps => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotification()),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
