/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../../../../../locales/i18n';
import { useTheme } from '../../../../util/theme';


import { SDKSelectorsIDs } from '../../../../../e2e/selectors/Settings/SDK.selectors';
import Icon, {
  IconName,
  IconSize } from
'../../../../component-library/components/Icons/Icon';
import Text, {
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import PermissionItem from './PermissionItem';


import {

  PermissionSource } from
'./PermissionItem/PermissionItem.types';





import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedEthChainIds } from
'@metamask/chain-agnostic-permission';






const createStyles = (
colors,
_typography,
_safeAreaInsets) =>

StyleSheet.create({
  perissionsWrapper: {
    backgroundColor: colors.background.default,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24
  },
  emptyPermissionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  description: {
    textAlign: 'center'
  }
});

const PermissionsManager = (props) => {
  const safeAreaInsets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography, safeAreaInsets);
  const { navigation } = props;
  const [inAppBrowserPermissions, setInAppBrowserPermissions] = useState(

    []);
  const subjects = useSelector(
    (state) =>

    state.engine.backgroundState.
    PermissionController.
    subjects
  );

  useEffect(() => {
    const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const walletConnectRegex = /^https?:\/\//;
    const inAppBrowserSubjects = [];

    Object.entries(subjects || {}).forEach(([key, value]) => {
      if (key === 'npm:@metamask/message-signing-snap') return;

      if (
      !uuidRegex.test(key) &&
      !walletConnectRegex.test(value.origin))
      {
        inAppBrowserSubjects.push(value);
      }
    });

    const mappedInAppBrowserPermissions =
    inAppBrowserSubjects.map((subject) => {
      const caip25CaveatValue = subject.permissions?.[
      Caip25EndowmentPermissionName]?.
      caveats?.find(
        (caveat) =>
        caveat.type === Caip25CaveatType
      )?.value ?? {
        optionalScopes: {
          'wallet:eip155': { accounts: [] }
        },
        requiredScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false
      };

      return {
        dappLogoUrl: '',
        dappHostName: subject.origin,
        numberOfAccountPermissions: caip25CaveatValue ?
        getEthAccounts(caip25CaveatValue).length :
        0,
        numberOfNetworkPermissions: caip25CaveatValue ?
        getPermittedEthChainIds(caip25CaveatValue).length :
        0,
        permissionSource: PermissionSource.MetaMaskBrowser
      };
    });

    const mappedPermissions = [
    ...mappedInAppBrowserPermissions];


    setInAppBrowserPermissions(mappedPermissions);
  }, [subjects]);

  useEffect(() => {
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.permissions_title'),
        navigation,
        false,
        colors
      )
    );
  }, [navigation, colors]);

  const goToPermissionsDetails = useCallback(
    (permissionItem) => {
      navigation.navigate('AccountPermissionsAsFullScreen', {
        hostInfo: {
          metadata: {
            origin: permissionItem.dappHostName
          }
        },
        isRenderedAsBottomSheet: false
      });
    },
    [navigation]
  );

  const renderPermissions = useCallback(
    () =>
    <>
        <ScrollView>
          {inAppBrowserPermissions.map((permissionItem, index) =>
        <PermissionItem
          key={`${index}`}
          item={permissionItem}
          onPress={() => {
            goToPermissionsDetails(permissionItem);
          }} />

        )}
        </ScrollView>
      </>,

    [goToPermissionsDetails, inAppBrowserPermissions]
  );

  const renderEmptyResult = () =>
  <View style={styles.emptyPermissionsContainer}>
      <Icon name={IconName.Global} size={IconSize.Xl} />
      <Text variant={TextVariant.HeadingSM}>
        {strings('app_settings.no_permissions')}
      </Text>
      <Text variant={TextVariant.BodyMD} style={styles.description}>
        {strings('app_settings.no_permissions_desc')}
      </Text>
    </View>;


  return (
    <View
      style={styles.perissionsWrapper}
      testID={SDKSelectorsIDs.SESSION_MANAGER_CONTAINER}>
      
      {inAppBrowserPermissions.length ?
      renderPermissions() :
      renderEmptyResult()}
    </View>);

};
export default PermissionsManager;