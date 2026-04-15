import React from 'react';
import { Linking } from 'react-native';
import Button, {
  ButtonVariants } from
'../../../../../component-library/components/Buttons/Button';

import useStyles from '../useStyles';



export default function AnnouncementCtaFooter(
props)
{
  const { styles } = useStyles();

  if (!props.mobileLink) {
    return null;
  }

  const { extensionLinkRoute, extensionLinkText } = props.mobileLink;

  // TODO - Feature Announcement Links are internal, needs rework
  return (
    <Button
      variant={ButtonVariants.Secondary}
      label={extensionLinkText}
      style={styles.ctaBtn}
      onPress={() => Linking.openURL(extensionLinkRoute)} />);


}