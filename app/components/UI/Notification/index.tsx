import React, { useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useNavigationState } from '@react-navigation/native';
import {
  removeCurrentNotification as removeCurrentNotificationAction,
  hideCurrentNotification as hideCurrentNotificationAction,
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

interface BaseInAppNotification {
  id?: string;
  status: string;
  autodismiss?: number;
  isVisible?: boolean;
}

interface TransactionInAppNotification extends BaseInAppNotification {
  type: typeof TRANSACTION;
  transaction: { id: string; [key: string]: unknown };
}

interface SimpleInAppNotification extends BaseInAppNotification {
  type: typeof SIMPLE;
  title?: string;
  description?: string;
}

type InAppNotification = TransactionInAppNotification | SimpleInAppNotification;

interface Props {
  currentNotification: InAppNotification;
  currentNotificationIsVisible: boolean;
  hideCurrentNotification: () => void;
  removeCurrentNotification: () => void;
}

// The JS selector is documented as taking RootState but actually receives the
// `notification` slice.
const selectCurrentNotification = currentNotificationSelector as unknown as (
  notificationState: RootState['notification'],
) => InAppNotification;

function Notification({
  currentNotification,
  currentNotificationIsVisible,
  hideCurrentNotification,
  removeCurrentNotification,
}: Props) {
  const notificationAnimated = useSharedValue(200);
  const routes = useNavigationState((state) => state.routes);

  const prevNotificationIsVisible = usePrevious(currentNotificationIsVisible);

  const animatedTimingStart = useCallback(
    (
      animatedRef: SharedValue<number>,
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

const mapStateToProps = (state: RootState) => {
  const currentNotification = selectCurrentNotification(state.notification);
  return {
    currentNotification,
    currentNotificationIsVisible: Boolean(currentNotification.isVisible),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  removeCurrentNotification: () => dispatch(removeCurrentNotificationAction()),
  hideCurrentNotification: () => dispatch(hideCurrentNotificationAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
