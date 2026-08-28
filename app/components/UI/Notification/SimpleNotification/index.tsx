import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import BaseNotification from './../BaseNotification';
import Device from '../../../../util/device';
import ElevatedView from 'react-native-elevated-view';
import { colors as importedColors } from '../../../../styles/common';

const styles = StyleSheet.create({
  modalTypeViewBrowser: {
    bottom: Device.isIphoneX() ? 70 : 60,
  },
  elevatedView: {
    backgroundColor: importedColors.transparent,
  },
  notificationContainer: {
    position: 'absolute',
    bottom: 0,
    paddingBottom: Device.isIphoneX() ? 20 : 10,
    left: 0,
    right: 0,
    backgroundColor: importedColors.transparent,
  },
});

interface CurrentNotification {
  status: string;
  title?: string;
  description?: string;
}

interface BaseNotificationProps {
  status: string;
  data: Pick<CurrentNotification, 'title' | 'description'>;
  onHide: () => void;
}

interface Props {
  isInBrowserView?: boolean;
  notificationAnimated: SharedValue<number>;
  currentNotification: CurrentNotification;
  hideCurrentNotification: () => void;
}

const TypedBaseNotification =
  BaseNotification as unknown as React.ComponentType<BaseNotificationProps>;

function SimpleNotification({
  isInBrowserView,
  notificationAnimated,
  hideCurrentNotification,
  currentNotification,
}: Props) {
  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        isInBrowserView && styles.modalTypeViewBrowser,
        { transform: [{ translateY: notificationAnimated }] },
      ]}
    >
      <ElevatedView style={styles.elevatedView} elevation={100}>
        <TypedBaseNotification
          status={currentNotification.status}
          data={{
            title: currentNotification.title,
            description: currentNotification.description,
          }}
          onHide={hideCurrentNotification}
        />
      </ElevatedView>
    </Animated.View>
  );
}

export default SimpleNotification;
