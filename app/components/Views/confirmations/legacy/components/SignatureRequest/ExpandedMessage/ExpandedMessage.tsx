import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { fontStyles, baseStyles } from '../../../../../../../styles/common';
import WebsiteIcon from '../../../../../../UI/WebsiteIcon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { strings } from '../../../../../../../../locales/i18n';
import Device from '../../../../../../../util/device';
import { getHost } from '../../../../../../../util/browser';
import { useTheme } from '../../../../../../../util/theme';
import { Colors } from '../../../../../../../util/theme/models';
import { PageMeta } from '../types';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    expandedRoot: {
      backgroundColor: colors.background.default,
      minHeight: Device.isIos() ? '70%' : '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: Device.isIphoneX() ? 44 : 24,
    },
    expandedMessageHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    arrowIcon: {
      ...baseStyles.flexGrow,
      color: colors.icon.muted,
    },
    iconHidden: {
      ...baseStyles.flexGrow,
    },
    messageLabelTextExpanded: {
      ...baseStyles.flexGrow,
      textAlign: 'center',
      ...fontStyles.bold,
      fontSize: 16,
      color: colors.text.default,
    },
    messageIntroWrapper: {
      alignItems: 'center',
      marginBottom: 20,
    },
    domainLogo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginBottom: 20,
    },
    messageFromLabel: {
      textAlign: 'center',
      ...fontStyles.bold,
      fontSize: 16,
      color: colors.text.default,
    },
    scrollView: {
      ...baseStyles.flexGrow,
    },
  });

export interface ExpandedMessageProps {
  currentPageInformation: PageMeta;
  renderMessage: () => ReactNode;
  toggleExpandedMessage: () => void;
}

const ExpandedMessage = ({
  currentPageInformation,
  renderMessage,
  toggleExpandedMessage,
}: ExpandedMessageProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const url = currentPageInformation.url;
  const icon = currentPageInformation.icon;
  const title = getHost(url);

  return (
    <View style={styles.expandedRoot}>
      <TouchableOpacity
        style={styles.expandedMessageHeader}
        onPress={toggleExpandedMessage}
      >
        <Ionicons name={'arrow-back'} size={30} style={styles.arrowIcon} />
        <Text style={styles.messageLabelTextExpanded}>
          {strings('signature_request.message')}
        </Text>
        <View style={styles.iconHidden} />
      </TouchableOpacity>
      <View style={styles.messageIntroWrapper}>
        <WebsiteIcon
          style={styles.domainLogo}
          title={title}
          url={url}
          icon={icon}
        />
        <Text style={styles.messageFromLabel}>
          {strings('signature_request.message_from')} {title}
        </Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <TouchableWithoutFeedback>
          <View>{renderMessage()}</View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default ExpandedMessage;
