/* eslint-disable @typescript-eslint/no-explicit-any */
interface SimpleNotificationProps {
  currentNotification?: Record<string, any>;
  hideCurrentNotification?: (...args: any[]) => any;
  isInBrowserView?: boolean;
  notificationAnimated?: Record<string, any>;
}
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import BaseNotification from './../BaseNotification';
import Device from '../../../../util/device';
import ElevatedView from 'react-native-elevated-view';
import { colors as importedColors } from '../../../../styles/common';

const styles: any = StyleSheet.create({
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

function SimpleNotification({
  isInBrowserView,
  notificationAnimated,
  hideCurrentNotification,
  currentNotification,
}: SimpleNotificationProps) {
  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        isInBrowserView && styles.modalTypeViewBrowser,
        { transform: [{ translateY: notificationAnimated }] },
      ]}
    >
      <ElevatedView style={styles.elevatedView} elevation={100}>
        <BaseNotification
          // @ts-expect-error -- legacy JavaScript UI type boundary
          status={currentNotification.status}
          data={{
            // @ts-expect-error -- legacy JavaScript UI type boundary
            title: currentNotification.title,
            // @ts-expect-error -- legacy JavaScript UI type boundary
            description: currentNotification.description,
          }}
          onHide={hideCurrentNotification}
        />
      </ElevatedView>
    </Animated.View>
  );
}

export default SimpleNotification;
