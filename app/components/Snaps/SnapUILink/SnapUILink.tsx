///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import React, { useContext } from 'react';
import { Alert, Text, StyleSheet, Linking, View } from 'react-native';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import { strings } from '../../../../locales/i18n';
import { SnapInterfaceContext } from '../SnapInterfaceContext';
import PREINSTALLED_SNAPS from '../../../lib/snaps/preinstalled-snaps';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  spacer: {
    width: 4,
  },
});

export interface SnapUILinkProps {
  children: React.ReactNode;
  href: string;
}

// Hosts registered as MetaMask universal links (AndroidManifest.xml and the
// iOS entitlements). Opening them from a Snap would re-enter the app's own
// deeplink handler, so Snap links may never target them. Branch link hosts
// are blocked with their subdomains; `applinks:metamask.io` only covers the
// exact host.
export const BLOCKED_SNAP_LINK_HOSTS = [
  'metamask.app.link',
  'metamask-alternate.app.link',
  'metamask.test-app.link',
  'metamask-alternate.test-app.link',
];

export const BLOCKED_SNAP_LINK_EXACT_HOSTS = ['metamask.io'];

const isBlockedHost = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/u, '');
  return (
    BLOCKED_SNAP_LINK_EXACT_HOSTS.includes(host) ||
    BLOCKED_SNAP_LINK_HOSTS.some(
      (blocked) => host === blocked || host.endsWith(`.${blocked}`),
    )
  );
};

export const validateUrl = (href: string) => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!href.startsWith('https://') || url.protocol !== 'https:') {
    throw new Error('Invalid URL');
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error('Invalid URL');
  }
};

const confirmLeavingMetaMask = (href: string) => {
  Alert.alert(
    strings('snap_ui.link.leave_metamask_title'),
    strings('snap_ui.link.leave_metamask_description', { url: href }),
    [
      {
        text: strings('snap_ui.link.leave_metamask_cancel'),
        style: 'cancel',
      },
      {
        text: strings('snap_ui.link.leave_metamask_confirm'),
        onPress: () => Linking.openURL(href),
      },
    ],
  );
};

export const SnapUILink: React.FC<SnapUILinkProps> = ({ href, children }) => {
  const snapId = useContext(SnapInterfaceContext)?.snapId;

  const onPress = () => {
    validateUrl(href);

    if (snapId && PREINSTALLED_SNAPS.some((snap) => snap.snapId === snapId)) {
      Linking.openURL(href);
      return;
    }

    confirmLeavingMetaMask(href);
  };

  return (
    <Text
      testID="snaps-ui-link"
      style={styles.container}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityHint={strings('snap_ui.link.accessibilityHint')}
    >
      {children}
      <View style={styles.spacer} />
      <Icon
        name={IconName.Export}
        color={IconColor.Primary}
        size={IconSize.Sm}
      />
    </Text>
  );
};

///: END:ONLY_INCLUDE_IF
