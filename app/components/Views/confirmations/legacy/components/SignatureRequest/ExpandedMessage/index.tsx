import React, { PureComponent, ReactNode } from 'react';
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
import { ThemeContext, mockTheme } from '../../../../../../../util/theme';
import { Theme } from '../../../../../../../util/theme/models';

const createStyles = (colors: Theme['colors']) =>
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

interface CurrentPageInformation {
  url: string;
  icon?: string;
}

interface ExpandedMessageProps {
  currentPageInformation: CurrentPageInformation;
  renderMessage: () => ReactNode;
  toggleExpandedMessage: () => void;
}

/**
 * Component that supports eth_signTypedData and eth_signTypedData_v3
 */
export default class ExpandedMessage extends PureComponent<ExpandedMessageProps> {
  static contextType = ThemeContext;

  render() {
    const { currentPageInformation, renderMessage, toggleExpandedMessage } =
      this.props;
    const url = currentPageInformation.url;
    const icon = currentPageInformation.icon;
    const title = getHost(url);
    const colors = (this.context as { colors: Theme['colors'] }).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.expandedRoot}>
        <TouchableOpacity
          style={styles.expandedMessageHeader}
          onPress={toggleExpandedMessage}
        >
          <Ionicons
            name={'arrow-back'}
            size={30}
            style={styles.arrowIcon}
          />
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
  }
}
