import React from 'react';
import { Animated as RNAnimated, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import BaseNotification, { BaseNotificationData } from './../BaseNotification';
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

interface Props {
  isInBrowserView?: boolean;
  notificationAnimated: RNAnimated.Value | RNAnimated.AnimatedInterpolation<number>;
  currentNotification: CurrentNotification;
  hideCurrentNotification?: () => void;
}

function SimpleNotification({
  isInBrowserView,
  notificationAnimated,
  hideCurrentNotification,
  currentNotification,
}: Props) {
  const data: BaseNotificationData = {
    title: currentNotification.title,
    description: currentNotification.description,
  };
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
          status={currentNotification.status}
          data={data}
          onHide={hideCurrentNotification}
        />
      </ElevatedView>
    </Animated.View>
  );
}

export default SimpleNotification;
