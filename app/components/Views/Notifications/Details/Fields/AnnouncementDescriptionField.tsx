import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import Html, {
  MixedStyleDeclaration,
  RenderersProps,
} from 'react-native-render-html';
import { ModalFieldAnnouncementDescription } from '../../../../../util/notifications/notification-states/types/NotificationModalDetails';
import useStyles from '../useStyles';

/**
 * Announcement links are only opened when they use https.
 * @param href - link target from the announcement HTML
 * @returns true when href parses as an https URL
 */
const isHttpsUrl = (href: string) => {
  try {
    return new URL(href).protocol === 'https:';
  } catch {
    return false;
  }
};

const renderersProps: Partial<RenderersProps> = {
  a: {
    onPress: (_event, href) => {
      if (isHttpsUrl(href)) {
        Linking.openURL(href);
      }
    },
  },
};

type AnnouncementDescriptionFieldProps = ModalFieldAnnouncementDescription;

function AnnouncementDescriptionField(
  props: AnnouncementDescriptionFieldProps,
) {
  const { styles } = useStyles();

  const [width, setWidth] = useState(0);

  return (
    <View
      style={styles.row}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Html
        source={{ html: props.description }}
        contentWidth={width}
        baseStyle={styles.announcementDescriptionText as MixedStyleDeclaration}
        renderersProps={renderersProps}
      />
    </View>
  );
}

export default AnnouncementDescriptionField;
