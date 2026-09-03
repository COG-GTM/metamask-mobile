import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { useNavigationState } from '@react-navigation/native';
import type { Dispatch } from 'redux';
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
import type { RootState } from '../../../reducers';
import type { CurrentNotification, AnimatedTimingStart } from './types';

const { TRANSACTION, SIMPLE } = NotificationTypes;

const BROWSER_ROUTE = 'BrowserView';

interface StateProps {
  currentNotification: CurrentNotification;
  currentNotificationIsVisible: boolean;
}

interface DispatchProps {
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

type Props = StateProps & DispatchProps;

function Notification({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification: hideNotification,
  removeCurrentNotification: removeNotification,
}: Props) {
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
}

const mapStateToProps = (state: RootState): StateProps => {
  const currentNotification = currentNotificationSelector(
    state.notification as Parameters<typeof currentNotificationSelector>[0],
  ) as CurrentNotification;
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotification()),
  hideCurrentNotification: () => dispatch(hideCurrentNotification()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
