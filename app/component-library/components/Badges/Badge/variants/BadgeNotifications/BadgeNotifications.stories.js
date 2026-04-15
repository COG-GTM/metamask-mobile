/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/display-name */
import React from 'react';
import { View } from 'react-native';

// External dependencies
import { IconName } from '../../../../Icons/Icon';

// Internal dependencies
import { default as BadgeBadgeNotificationssComponent } from './BadgeNotifications';
import { SAMPLE_BADGENOTIFICATIONS_PROPS } from './BadgeNotifications.constants';


const BadgeBadgeNotificationsMeta = {
  title: 'Component Library / Badges',
  component: BadgeBadgeNotificationssComponent,
  argTypes: {
    iconName: {
      options: IconName,
      control: {
        type: 'select'
      }
    }
  }
};
export default BadgeBadgeNotificationsMeta;

export const BadgeNotification = {
  args: {
    iconName: SAMPLE_BADGENOTIFICATIONS_PROPS.iconName
  },
  render: (args) =>
  <View
    style={{
      height: 50,
      width: 50
    }}>
    
      <BadgeBadgeNotificationssComponent
      {...args}
      iconName={SAMPLE_BADGENOTIFICATIONS_PROPS.iconName} />
    
    </View>

};