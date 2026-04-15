
import React, { useCallback, useMemo } from 'react';
import NotificationsService from '../../../../util/notifications/services/NotificationService';
import { ActivityIndicator, FlatList, View } from 'react-native';
import ScrollableTabView, {
  DefaultTabBar } from


'react-native-scrollable-tab-view';
import { NotificationsViewSelectorsIDs } from '../../../../../e2e/selectors/wallet/NotificationsView.selectors';
import { strings } from '../../../../../locales/i18n';
import {
  hasNotificationComponents,
  hasNotificationModal,
  NotificationComponentState } from
'../../../../util/notifications/notification-states';
import Routes from '../../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../../core/Analytics';

import {
  useListNotifications,
  useMarkNotificationAsRead } from
'../../../../util/notifications/hooks/useNotifications';
import { useMetrics } from '../../../hooks/useMetrics';
import Empty from '../Empty';
import { NotificationMenuItem } from '../NotificationMenuItem';
import useStyles from './useStyles';
import { NotificationMenuViewSelectorsIDs } from '../../../../../e2e/selectors/Notifications/NotificationMenuView.selectors';


















function Loading() {
  const {
    theme: { colors },
    styles
  } = useStyles();

  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator color={colors.primary.default} size="large" />
    </View>);

}

export function useNotificationOnClick(
props)
{
  const { markNotificationAsRead } = useMarkNotificationAsRead();
  const { trackEvent, createEventBuilder } = useMetrics();
  const onNotificationClick = useCallback(
    (item) => {
      markNotificationAsRead([
      {
        id: item.id,
        type: item.type,
        isRead: item.isRead
      }]
      );
      if (hasNotificationModal(item?.type)) {
        props.navigation.navigate(Routes.NOTIFICATIONS.DETAILS, {
          notification: item
        });
      }

      NotificationsService.getBadgeCount().then((count) => {
        if (count > 0) {
          NotificationsService.decrementBadgeCount(count - 1);
        } else {
          NotificationsService.setBadgeCount(0);
        }
      });

      trackEvent(
        createEventBuilder(MetaMetricsEvents.NOTIFICATION_CLICKED).
        addProperties({
          notification_id: item.id,
          notification_type: item.type,
          previously_read: item.isRead,
          ...('chain_id' in item && { chain_id: item.chain_id })
        }).
        build()
      );
    },
    [markNotificationAsRead, props.navigation, trackEvent, createEventBuilder]
  );

  return onNotificationClick;
}

export function NotificationsListItem(props) {
  const onNotificationClick = useNotificationOnClick(props);

  const menuItemState = useMemo(() => {
    const notificationState =
    props.notification?.type &&
    hasNotificationComponents(props.notification.type) ?
    NotificationComponentState[props.notification.type] :
    undefined;

    return notificationState?.createMenuItem(props.notification);
  }, [props.notification]);

  if (!hasNotificationComponents(props.notification.type) || !menuItemState) {
    return null;
  }

  return (
    <NotificationMenuItem.Root
      handleOnPress={() => onNotificationClick(props.notification)}
      isRead={props.notification.isRead}
      testID={NotificationMenuViewSelectorsIDs.ITEM(props.notification.id)}>
      
      <NotificationMenuItem.Icon
        isRead={props.notification.isRead}
        {...menuItemState} />
      
      <NotificationMenuItem.Content {...menuItemState} />
    </NotificationMenuItem.Root>);

}

function useNotificationListProps(props)

{
  const { styles } = useStyles();
  const { listNotifications, isLoading } = useListNotifications();
  const getListProps = useCallback(
    (data, tabLabel) => {
      const listProps = {
        keyExtractor: (item) => item.id,
        data,
        ListEmptyComponent:
        <Empty
          testID={NotificationsViewSelectorsIDs.NO_NOTIFICATIONS_CONTAINER} />,


        contentContainerStyle: styles.list,
        renderItem: ({ item }) =>
        <NotificationsListItem
          notification={item}
          navigation={props.navigation} />,


        onRefresh: async () => await listNotifications(),
        refreshing: isLoading,
        initialNumToRender: 10,
        maxToRenderPerBatch: 2,
        onEndReachedThreshold: 0.5
      };

      return { ...listProps, tabLabel: tabLabel ?? '' };
    },
    [isLoading, listNotifications, props.navigation, styles.list]
  );

  return getListProps;
}

function SingleNotificationList(props) {
  const getListProps = useNotificationListProps(props);

  return <FlatList {...getListProps(props.allNotifications)} />;
}

function TabbedNotificationList(props) {
  const {
    theme: { colors },
    styles
  } = useStyles();
  const { trackEvent, createEventBuilder } = useMetrics();

  const getListProps = useNotificationListProps(props);

  const onTabClick = useCallback(
    (tabLabel) => {
      switch (tabLabel) {
        case strings('notifications.list.0'):
          trackEvent(
            createEventBuilder(MetaMetricsEvents.ALL_NOTIFICATIONS).build()
          );
          break;
        case strings('notifications.list.1'):
          trackEvent(
            createEventBuilder(MetaMetricsEvents.WALLET_NOTIFICATIONS).build()
          );
          break;
        case strings('notifications.list.2'):
          // trackEvent(
          //   createEventBuilder(MetaMetricsEvents.WEB3_NOTIFICATIONS).build(),
          // );
          break;
        default:
          break;
      }
    },
    [trackEvent, createEventBuilder]
  );

  return (
    <ScrollableTabView
      renderTabBar={(tabProps) =>
      <View>
          <DefaultTabBar
          underlineStyle={styles.tabUnderlineStyle}
          activeTextColor={colors.primary.default}
          inactiveTextColor={colors.text.default}
          backgroundColor={colors.background.default}
          tabStyle={styles.tabStyle}
          textStyle={styles.textStyle}
          style={styles.tabBar}
          {...tabProps} />
        
        </View>
      }
      onChangeTab={(val) => onTabClick(val.ref.props.tabLabel)}>
      
      {/* Tab 1 - All Notifications */}
      <FlatList
        {...getListProps(
          props.allNotifications,
          strings(`notifications.list.0`)
        )} />
      

      {/* Tab 2 - Wallet Notifications */}
      <FlatList
        {...getListProps(
          props.allNotifications,
          strings(`notifications.list.1`)
        )} />
      

      {/* Tab 3 - Web 3 Notifications */}
      <FlatList
        {...getListProps(
          props.web3Notifications,
          strings(`notifications.list.2`)
        )} />
      
    </ScrollableTabView>);

}

const Notifications = (props) => {
  const { styles } = useStyles();
  if (props.loading) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>);

  }

  if (props.web3Notifications.length > 0) {
    return (
      <View style={styles.container}>
        <TabbedNotificationList {...props} />
      </View>);

  }

  return (
    <View style={styles.container}>
      <SingleNotificationList {...props} />
    </View>);

};

export default Notifications;