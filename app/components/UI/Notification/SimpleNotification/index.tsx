import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
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

interface SimpleNotificationData {
  status?: string;
  title?: string;
  description?: string;
}

interface SimpleNotificationProps {
  isInBrowserView?: boolean;
  notificationAnimated?: SharedValue<number> | number;
  currentNotification: SimpleNotificationData;
  hideCurrentNotification?: () => void;
}

function SimpleNotification({
  isInBrowserView,
  notificationAnimated,
  hideCurrentNotification,
  currentNotification,
}: SimpleNotificationProps) {
  const animatedTransform = {
    transform: [{ translateY: notificationAnimated }],
  } as unknown as StyleProp<ViewStyle>;
  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        isInBrowserView && styles.modalTypeViewBrowser,
        animatedTransform,
      ]}
    >
      <ElevatedView style={styles.elevatedView} elevation={100}>
        <BaseNotification
          status={currentNotification.status}
          data={{
            title: currentNotification.title ?? null,
            description: currentNotification.description ?? null,
          }}
          onHide={hideCurrentNotification}
        />
      </ElevatedView>
    </Animated.View>
  );
}

export default SimpleNotification;
